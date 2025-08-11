import { spawn, ChildProcess, execSync } from 'child_process';
import { RadioStation, RadioBrowserStation } from './types';
import axios from 'axios';
import chalk from 'chalk';

export class RadioPlayer {
  private currentProcess: ChildProcess | null = null;
  private currentStation: RadioStation | null = null;
  private processIds: number[] = []; // Track all spawned process IDs

  async play(station: RadioStation): Promise<void> {
    // Stop current playback if any
    this.stop();

    this.currentStation = station;
    
    try {
      // Try to use mpv first (most reliable for streaming)
      this.currentProcess = spawn('mpv', [
        '--no-video',
        '--no-terminal',
        '--really-quiet',
        '--volume=70',
        station.url
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true  // Create a new process group
      });

      // Track the process ID
      if (this.currentProcess.pid) {
        this.processIds.push(this.currentProcess.pid);
      }

      this.currentProcess.on('error', (error) => {
        if (error.message.includes('ENOENT')) {
          // mpv not found, try VLC
          this.tryVLC(station);
        } else {
          console.error(chalk.red('❌ Playback error:'), error.message);
        }
      });

      this.currentProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.log(chalk.yellow('🔇 Playback stopped'));
        }
      });

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (this.currentProcess && !this.currentProcess.killed) {
        console.log(chalk.green('✅ Now playing!'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to start playback:'), error);
      this.tryVLC(station);
    }
  }

  private tryVLC(station: RadioStation): void {
    try {
      this.currentProcess = spawn('vlc', [
        '--intf', 'dummy',
        '--extraintf', 'http',
        '--http-password', 'vlc',
        station.url
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true  // Create a new process group
      });

      // Track the process ID
      if (this.currentProcess.pid) {
        this.processIds.push(this.currentProcess.pid);
      }

      this.currentProcess.on('error', (error) => {
        if (error.message.includes('ENOENT')) {
          console.error(chalk.red('❌ Neither mpv nor VLC found. Please install one of them:'));
          console.log(chalk.yellow('  macOS: brew install mpv  or  brew install vlc'));
          console.log(chalk.yellow('  Linux: sudo apt install mpv  or  sudo apt install vlc'));
        } else {
          console.error(chalk.red('❌ VLC playback error:'), error.message);
        }
      });

      this.currentProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.log(chalk.yellow('🔇 Playback stopped'));
        }
      });

    } catch (error) {
      console.error(chalk.red('❌ Failed to start VLC:'), error);
    }
  }

  stop(): void {
    this.killAllProcesses();
    this.currentProcess = null;
    this.currentStation = null;
  }

  // Immediate cleanup for shutdown scenarios
  forceStop(): void {
    this.killAllProcesses(true);
    this.killOrphanedProcesses();
    this.currentProcess = null;
    this.currentStation = null;
  }

  // Kill any orphaned mpv/vlc processes
  private killOrphanedProcesses(): void {
    try {
      // Find and kill mpv processes
      try {
        const mpvPids = execSync('pgrep mpv', { encoding: 'utf8' }).trim().split('\n');
        for (const pid of mpvPids) {
          if (pid) {
            try {
              process.kill(parseInt(pid), 'SIGKILL');
            } catch (error) {
              // Process might already be dead
            }
          }
        }
      } catch (error) {
        // No mpv processes found, which is fine
      }

      // Find and kill vlc processes
      try {
        const vlcPids = execSync('pgrep vlc', { encoding: 'utf8' }).trim().split('\n');
        for (const pid of vlcPids) {
          if (pid) {
            try {
              process.kill(parseInt(pid), 'SIGKILL');
            } catch (error) {
              // Process might already be dead
            }
          }
        }
      } catch (error) {
        // No vlc processes found, which is fine
      }
    } catch (error) {
      // pgrep might not be available or other error, ignore
    }
  }

  private killAllProcesses(force: boolean = false): void {
    // Kill the current process if it exists
    if (this.currentProcess && !this.currentProcess.killed) {
      try {
        if (force) {
          // Kill the entire process group
          if (this.currentProcess.pid) {
            process.kill(-this.currentProcess.pid, 'SIGKILL');
          }
        } else {
          // Try graceful shutdown first
          if (this.currentProcess.pid) {
            process.kill(-this.currentProcess.pid, 'SIGTERM');
          }
          
          // Force kill after 1 second if still running
          setTimeout(() => {
            if (this.currentProcess && !this.currentProcess.killed && this.currentProcess.pid) {
              try {
                process.kill(-this.currentProcess.pid, 'SIGKILL');
              } catch (error) {
                // Process might already be dead
              }
            }
          }, 1000);
        }
      } catch (error) {
        // Process might already be dead, ignore errors
      }
    }

    // Also kill any tracked processes by PID
    for (const pid of this.processIds) {
      try {
        if (force) {
          process.kill(-pid, 'SIGKILL'); // Kill process group
        } else {
          process.kill(-pid, 'SIGTERM'); // Try graceful first
          setTimeout(() => {
            try {
              process.kill(-pid, 'SIGKILL');
            } catch (error) {
              // Process might already be dead
            }
          }, 1000);
        }
      } catch (error) {
        // Process might already be dead, ignore errors
      }
    }

    // Clear the tracked process IDs
    this.processIds = [];
  }

  getCurrentStation(): RadioStation | null {
    return this.currentStation;
  }

  isPlaying(): boolean {
    return this.currentProcess !== null && !this.currentProcess.killed;
  }

  async searchStations(query: string, limit: number = 20): Promise<RadioStation[]> {
    try {
      const response = await axios.get<RadioBrowserStation[]>(
        'http://all.api.radio-browser.info/json/stations/search',
        {
          params: {
            name: query,
            limit,
            hidebroken: true,
            order: 'votes',
            reverse: true
          },
          timeout: 5000
        }
      );

      return response.data
        .filter(station => station.lastcheckok === 1) // Only working stations
        .map(station => ({
          name: station.name,
          url: station.url_resolved || station.url,
          genre: station.tags,
          country: station.country,
          bitrate: station.bitrate,
          codec: station.codec
        }));

    } catch (error) {
      console.error(chalk.red('❌ Search failed:'), error);
      return [];
    }
  }

  async searchByGenre(genre: string, limit: number = 20): Promise<RadioStation[]> {
    try {
      const response = await axios.get<RadioBrowserStation[]>(
        'http://all.api.radio-browser.info/json/stations/search',
        {
          params: {
            tag: genre,
            limit,
            hidebroken: true,
            order: 'votes',
            reverse: true
          },
          timeout: 5000
        }
      );

      return response.data
        .filter(station => station.lastcheckok === 1)
        .map(station => ({
          name: station.name,
          url: station.url_resolved || station.url,
          genre: station.tags,
          country: station.country,
          bitrate: station.bitrate,
          codec: station.codec
        }));

    } catch (error) {
      console.error(chalk.red('❌ Genre search failed:'), error);
      return [];
    }
  }
}
