{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript
    pkgs.nodePackages.vite
    pkgs.python39
    pkgs.python39Packages.pip
    pkgs.python39Packages.virtualenv
    pkgs.tesseract
    pkgs.poppler_utils
    pkgs.ffmpeg
    pkgs.imagemagick
  ];
} 