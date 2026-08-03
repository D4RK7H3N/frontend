const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [16, 24, 32, 48, 64, 128, 256];
const buildDir = path.resolve(__dirname, "../build");
const svgPath = path.join(buildDir, "icon.svg");
const pngPath = path.join(buildDir, "icon.png");

async function main() {
  const svg = fs.readFileSync(svgPath, "utf-8");
  await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(pngPath);
  console.log("✓ Generated icon.png (256x256)");

  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(sizes.length, 4);
  const entries = [];
  const imageData = [];
  let offset = 6 + sizes.length * 16;
  for (const size of sizes) {
    const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    imageData.push(png);
    offset += png.length;
  }
  const ico = Buffer.concat([icoHeader, ...entries, ...imageData]);
  fs.writeFileSync(path.join(buildDir, "icon.ico"), ico);
  console.log("✓ Generated icon.ico (16x16 through 256x256)");
}

main().catch(console.error);
