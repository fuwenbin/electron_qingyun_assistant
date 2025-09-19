# FFmpeg Setup Instructions

This project requires FFmpeg binaries for video processing functionality. Due to GitHub's file size limitations, these binaries are not included in the repository.

## Automatic Setup

Run the setup script to configure FFmpeg:

```bash
npm run setup:ffmpeg
```

## Manual Setup

### Windows

1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. Extract the archive
3. Copy `ffmpeg.exe`, `ffprobe.exe`, and `ffplay.exe` to the `bin/` directory in the project root

### macOS

1. Install FFmpeg using Homebrew:
   ```bash
   brew install ffmpeg
   ```
2. Copy the binaries to the bin directory:
   ```bash
   mkdir -p bin
   cp $(which ffmpeg) bin/
   cp $(which ffprobe) bin/
   cp $(which ffplay) bin/
   ```

### Linux

1. Install FFmpeg using your package manager:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # CentOS/RHEL
   sudo yum install ffmpeg
   ```
2. Copy the binaries to the bin directory:
   ```bash
   mkdir -p bin
   cp $(which ffmpeg) bin/
   cp $(which ffprobe) bin/
   cp $(which ffplay) bin/
   ```

## Verification

After setup, verify the installation:

```bash
# Check if binaries exist
ls -la bin/

# Test FFmpeg functionality
npm run electron:dev
```

## Notes

- The `bin/` directory is included in `.gitignore` to prevent large files from being committed
- FFmpeg binaries will be automatically copied to the app resources during the build process
- For CI/CD environments, ensure the setup script runs before building the application