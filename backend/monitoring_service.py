import asyncio
import httpx
import socket
import logging
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
import subprocess
import re
from email_service import send_down_notification

logger = logging.getLogger(__name__)

def get_db():
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        logger.error("MONGO_URL not configured")
        return None
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ.get('DB_NAME', 'test_database')]

async def check_https_monitor(target: str) -> Tuple[str, float, str]:
    """Check HTTPS website status"""
    try:
        start_time = datetime.now()
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(target)
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000  # ms
            
            if response.status_code < 400:
                return "up", response_time, None
            else:
                return "down", response_time, f"HTTP {response.status_code}"
    except httpx.TimeoutException:
        return "down", None, "Connection timeout"
    except httpx.ConnectError:
        return "down", None, "Connection failed"
    except Exception as e:
        return "down", None, str(e)

async def check_socket_monitor(target: str) -> Tuple[str, float, str]:
    """Check Socket connection status"""
    try:
        # Parse host:port
        if ':' not in target:
            return "down", None, "Invalid format. Use host:port"
        
        host, port = target.rsplit(':', 1)
        port = int(port)
        
        start_time = datetime.now()
        
        # Try to connect to socket
        loop = asyncio.get_event_loop()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        
        try:
            await loop.run_in_executor(None, sock.connect, (host, port))
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000  # ms
            sock.close()
            return "up", response_time, None
        except (socket.timeout, socket.error) as e:
            sock.close()
            return "down", None, f"Socket error: {str(e)}"
            
    except ValueError:
        return "down", None, "Invalid port number"
    except Exception as e:
        return "down", None, str(e)

async def check_udp_monitor(target: str, last_packet_count: Optional[int] = None, 
                           last_activity_time: Optional[datetime] = None) -> Tuple[str, float, str, int, datetime]:
    """
    Check UDP listener activity by monitoring received packet count
    Returns: (status, response_time, error_message, current_packet_count, activity_time)
    """
    try:
        # Parse host:port
        if ':' not in target:
            return "down", None, "Invalid format. Use host:port", 0, datetime.now(timezone.utc)
        
        host, port = target.rsplit(':', 1)
        port = int(port)
        
        start_time = datetime.now()
        
        # Get UDP socket statistics using ss command
        # ss -u -n shows UDP sockets with numeric addresses
        try:
            # For localhost, we can check /proc/net/udp
            if host in ['127.0.0.1', 'localhost', '0.0.0.0']:
                # Read /proc/net/udp for socket statistics
                with open('/proc/net/udp', 'r') as f:
                    lines = f.readlines()
                
                # Convert port to hex (network byte order)
                port_hex = f"{port:04X}"
                
                current_packet_count = 0
                found_socket = False
                
                for line in lines[1:]:  # Skip header
                    parts = line.split()
                    if len(parts) >= 13:
                        local_addr = parts[1]
                        # Format: IP:PORT in hex
                        if port_hex in local_addr:
                            found_socket = True
                            # rx_queue is in parts[4], tx_queue in parts[5]
                            # We'll use inode and check if socket is active
                            # For better accuracy, use ss command
                            break
                
                if found_socket:
                    # Socket exists, now check packet activity with ss
                    result = subprocess.run(
                        ['ss', '-u', '-n', 'sport', '=', str(port)],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    
                    if result.returncode == 0:
                        # Count number of connections/packets
                        output_lines = result.stdout.strip().split('\n')
                        # First line is header, rest are connections
                        connection_count = max(0, len(output_lines) - 1)
                        current_packet_count = connection_count
                    else:
                        # Fallback: check with netstat
                        result = subprocess.run(
                            ['netstat', '-anu'],
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                        
                        if result.returncode == 0:
                            # Count lines that match our port
                            matches = [l for l in result.stdout.split('\n') 
                                     if f':{port}' in l and 'udp' in l.lower()]
                            current_packet_count = len(matches)
                
                else:
                    # Socket not found
                    return "down", None, f"UDP listener not found on port {port}", 0, datetime.now(timezone.utc)
                
                end_time = datetime.now()
                response_time = (end_time - start_time).total_seconds() * 1000
                
                # Determine status based on packet activity
                current_time = datetime.now(timezone.utc)
                
                # First check or packet count changed
                if last_packet_count is None or current_packet_count != last_packet_count:
                    # Activity detected
                    return "up", response_time, None, current_packet_count, current_time
                
                # No change in packet count, check if it's been too long
                if last_activity_time:
                    time_since_activity = (current_time - last_activity_time).total_seconds() / 60  # minutes
                    
                    if time_since_activity >= 30:  # 30 minutes threshold
                        return "down", response_time, f"No UDP activity for {int(time_since_activity)} minutes", current_packet_count, last_activity_time
                    else:
                        # Still within threshold, consider UP
                        return "up", response_time, f"No new packets ({int(time_since_activity)}m since last activity)", current_packet_count, last_activity_time
                else:
                    # No previous activity time, assume active now
                    return "up", response_time, None, current_packet_count, current_time
            
            else:
                # Remote host - fallback to ping test
                return "down", None, "Remote UDP monitoring not yet supported for activity checking", 0, datetime.now(timezone.utc)
                
        except FileNotFoundError:
            return "down", None, "Unable to read UDP statistics (proc not available)", 0, datetime.now(timezone.utc)
        except subprocess.TimeoutExpired:
            return "down", None, "Timeout checking UDP statistics", 0, datetime.now(timezone.utc)
        except Exception as e:
            return "down", None, f"Error checking UDP stats: {str(e)}", 0, datetime.now(timezone.utc)
            
    except ValueError:
        return "down", None, "Invalid port number", 0, datetime.now(timezone.utc)
    except Exception as e:
        return "down", None, str(e), 0, datetime.now(timezone.utc)

async def check_monitor(monitor: dict):
    """Check a single monitor and update its status"""
    try:
        db = get_db()
        if db is None:
            logger.error("Database not available")
            return
            
        monitor_id = monitor['id']
        monitor_type = monitor['monitor_type']
        target = monitor['target']
        
        # Check monitor based on type
        if monitor_type == 'https':
            status, response_time, error_message = await check_https_monitor(target)
            update_data = {
                'status': status,
                'last_checked': datetime.now(timezone.utc).isoformat(),
                'response_time': response_time
            }
            
        elif monitor_type == 'socket':
            status, response_time, error_message = await check_socket_monitor(target)
            update_data = {
                'status': status,
                'last_checked': datetime.now(timezone.utc).isoformat(),
                'response_time': response_time
            }
            
        elif monitor_type == 'udp':
            # UDP monitoring with activity tracking
            last_packet_count = monitor.get('last_packet_count')
            last_activity_time = monitor.get('last_activity_time')
            if last_activity_time and isinstance(last_activity_time, str):
                last_activity_time = datetime.fromisoformat(last_activity_time)
            
            status, response_time, error_message, current_packet_count, activity_time = await check_udp_monitor(
                target, last_packet_count, last_activity_time
            )
            
            update_data = {
                'status': status,
                'last_checked': datetime.now(timezone.utc).isoformat(),
                'response_time': response_time,
                'last_packet_count': current_packet_count,
                'last_activity_time': activity_time.isoformat()
            }
        else:
            logger.error(f"Unknown monitor type: {monitor_type}")
            return
        
        # Get previous status
        previous_status = monitor.get('status')
        
        # Send notification if monitor went down (and wasn't already down)
        if status == 'down' and previous_status != 'down':
            # Send email notification
            await send_down_notification(
                monitor_name=monitor['name'],
                monitor_type=monitor_type,
                target=target,
                error_message=error_message
            )
            update_data['last_notified'] = datetime.now(timezone.utc).isoformat()
        elif status == 'up' and previous_status == 'down':
            # Clear last_notified when monitor comes back up
            update_data['last_notified'] = None
        
        await db.monitors.update_one(
            {'id': monitor_id},
            {'$set': update_data}
        )
        
        # Create log entry
        log_entry = {
            'id': f"{monitor_id}_{datetime.now(timezone.utc).timestamp()}",
            'monitor_id': monitor_id,
            'status': status,
            'response_time': response_time,
            'error_message': error_message,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        await db.monitor_logs.insert_one(log_entry)
        
        logger.info(f"Monitor {monitor['name']} checked: {status}")
        
    except Exception as e:
        logger.error(f"Error checking monitor {monitor.get('name', 'unknown')}: {str(e)}")

async def run_monitoring_cycle():
    """Run a full monitoring cycle for all monitors"""
    try:
        db = get_db()
        if db is None:
            logger.error("Database not available")
            return
            
        logger.info("Starting monitoring cycle...")
        
        # Get all monitors
        monitors = await db.monitors.find({}, {"_id": 0}).to_list(None)
        
        if not monitors:
            logger.info("No monitors to check")
            return
        
        # Check all monitors concurrently
        tasks = [check_monitor(monitor) for monitor in monitors]
        await asyncio.gather(*tasks)
        
        logger.info(f"Monitoring cycle completed. Checked {len(monitors)} monitors.")
        
    except Exception as e:
        logger.error(f"Error in monitoring cycle: {str(e)}")