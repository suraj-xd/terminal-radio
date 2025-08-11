#!/usr/bin/env node

import { RadioPlayer } from './radio-player';
import { RadioStation } from './types';
import chalk from 'chalk';
import inquirer from 'inquirer';

const POPULAR_STATIONS: RadioStation[] = [
  {
    name: "BBC Radio 1",
    url: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",
    genre: "Pop/Rock"
  },
  {
    name: "Jazz24",
    url: "http://live.str3am.com:2540/jazz24",
    genre: "Jazz"
  },
  {
    name: "Lofi Hip Hop Radio",
    url: "http://hyades.shoutca.st:8043/stream",
    genre: "Lofi"
  },
  {
    name: "Classic FM",
    url: "http://media-ice.musicradio.com/ClassicFMMP3",
    genre: "Classical"
  },
  {
    name: "Radio Paradise",
    url: "http://stream.radioparadise.com/aac-320",
    genre: "Eclectic"
  },
  {
    name: "SomaFM - Groove Salad",
    url: "http://ice1.somafm.com/groovesalad-256-mp3",
    genre: "Ambient"
  },
  {
    name: "NPR News",
    url: "http://npr-ice.streamguys1.com/live.mp3",
    genre: "News"
  }
];

// Global radioPlayer instance for signal handlers
let radioPlayer: RadioPlayer;

async function main() {
  console.clear();
  console.log(chalk.cyan.bold('🎵 Terminal Radio Player 🎵\n'));
  
  radioPlayer = new RadioPlayer();
  
  while (true) {
    try {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🎧 Play from Popular Stations', value: 'popular' },
            { name: '🔍 Search Stations Online', value: 'search' },
            { name: '📻 Enter Custom Stream URL', value: 'custom' },
            { name: '⏹️  Stop Current Station', value: 'stop' },
            { name: '❌ Exit', value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'popular':
          await playFromPopular(radioPlayer);
          break;
        case 'search':
          await searchAndPlay(radioPlayer);
          break;
        case 'custom':
          await playCustomUrl(radioPlayer);
          break;
        case 'stop':
          radioPlayer.stop();
          console.log(chalk.yellow('🔇 Radio stopped'));
          break;
        case 'exit':
          radioPlayer.stop();
          console.log(chalk.green('👋 Thanks for listening!'));
          process.exit(0);
          break;
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
    }
  }
}

async function playFromPopular(radioPlayer: RadioPlayer) {
  const { station } = await inquirer.prompt([
    {
      type: 'list',
      name: 'station',
      message: 'Choose a station:',
      choices: POPULAR_STATIONS.map(s => ({
        name: `${s.name} (${s.genre})`,
        value: s
      }))
    }
  ]);

  console.log(chalk.blue(`🎵 Playing: ${station.name}`));
  await radioPlayer.play(station);
  showControls();
}

async function searchAndPlay(radioPlayer: RadioPlayer) {
  const { searchTerm } = await inquirer.prompt([
    {
      type: 'input',
      name: 'searchTerm',
      message: 'Search for stations (genre, country, or name):'
    }
  ]);

  console.log(chalk.yellow('🔍 Searching...'));
  const stations = await radioPlayer.searchStations(searchTerm);
  
  if (stations.length === 0) {
    console.log(chalk.red('No stations found. Try a different search term.'));
    return;
  }

  const { selectedStation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedStation',
      message: 'Choose a station:',
      choices: stations.slice(0, 10).map(s => ({
        name: `${s.name} (${s.country || 'Unknown'}) - ${s.genre || 'Various'}`,
        value: s
      }))
    }
  ]);

  console.log(chalk.blue(`🎵 Playing: ${selectedStation.name}`));
  await radioPlayer.play(selectedStation);
  showControls();
}

async function playCustomUrl(radioPlayer: RadioPlayer) {
  const { url, name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter stream URL:'
    },
    {
      type: 'input',
      name: 'name',
      message: 'Station name (optional):',
      default: 'Custom Station'
    }
  ]);

  const station: RadioStation = { name, url, genre: 'Custom' };
  console.log(chalk.blue(`🎵 Playing: ${station.name}`));
  await radioPlayer.play(station);
  showControls();
}

function showControls() {
  console.log(chalk.gray('\n📱 Controls: Press Ctrl+C to stop, or wait for menu to return\n'));
}

// Handle graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(chalk.yellow(`\n🔇 Received ${signal}, stopping radio...`));
  if (radioPlayer) {
    radioPlayer.forceStop();
  }
  console.log(chalk.green('👋 Radio stopped. Thanks for listening!'));
  
  // Close stdin to exit inquirer prompts
  if (process.stdin) {
    process.stdin.pause();
    process.stdin.destroy();
  }
  
  // Force exit immediately
  setTimeout(() => {
    process.exit(0);
  }, 100);
}

// Handle various termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Handle unexpected exits
process.on('exit', () => {
  if (radioPlayer) {
    radioPlayer.forceStop();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  if (radioPlayer) {
    radioPlayer.forceStop();
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled Promise Rejection:'), reason);
  if (radioPlayer) {
    radioPlayer.forceStop();
  }
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}
