#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const FFMPEG_VERSION = '6.1.1';
const FFMPEG_BASE_URL = 'https://github.com/BtbN/FFmpeg-Builds/releases/download';

const binDir = path.join(__dirname, 'bin');
const platform = process.platform;

// FFmpeg download URLs for different platforms
const downloadUrls = {
  win32: {
    ffmpeg: `${FFMPEG_BASE_URL}/autobuild-2024-01-01-12-55/ffmpeg-master-latest-win64-gpl.zip`,
    // Alternative: use a more reliable source
    // ffmpeg: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
  },
  darwin: {
    ffmpeg: `${FFMPEG_BASE_URL}/autobuild-2024-01-01-12-55/ffmpeg-master-latest-macos64-gpl.zip`
  },
  linux: {
    ffmpeg: `${FFMPEG_BASE_URL}/autobuild-2024-01-01-12-55/ffmpeg-master-latest-linux64-gpl.tar.xz`
  }
};

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        return downloadFile(response.headers.location, outputPath);
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function setupFFmpeg() {
  console.log('Setting up FFmpeg binaries...');
  
  // Create bin directory if it doesn't exist
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Check if FFmpeg binaries already exist
  const ffmpegPath = path.join(binDir, platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const ffprobePath = path.join(binDir, platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  const ffplayPath = path.join(binDir, platform === 'win32' ? 'ffplay.exe' : 'ffplay');

  if (fs.existsSync(ffmpegPath) && fs.existsSync(ffprobePath) && fs.existsSync(ffplayPath)) {
    console.log('FFmpeg binaries already exist. Skipping download.');
    return;
  }

  // For development, you can copy from system installation or download
  if (platform === 'win32') {
    console.log('For Windows development, please manually download FFmpeg from:');
    console.log('https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip');
    console.log('Extract ffmpeg.exe, ffprobe.exe, and ffplay.exe to the bin/ directory');
  } else if (platform === 'darwin') {
    console.log('For macOS development, you can install FFmpeg using Homebrew:');
    console.log('brew install ffmpeg');
    console.log('Then copy the binaries to bin/ directory');
  } else {
    console.log('For Linux development, install FFmpeg using your package manager:');
    console.log('sudo apt-get install ffmpeg (Ubuntu/Debian)');
    console.log('sudo yum install ffmpeg (CentOS/RHEL)');
  }
}

if (require.main === module) {
  setupFFmpeg().catch(console.error);
}

module.exports = { setupFFmpeg };