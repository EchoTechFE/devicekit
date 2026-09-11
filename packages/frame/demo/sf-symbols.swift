import AppKit
import Foundation

struct SymbolRequest {
    let key: String
    let name: String
}

let requests = [
    SymbolRequest(key: "signal", name: "cellularbars"),
    SymbolRequest(key: "wifi", name: "wifi"),
    SymbolRequest(key: "battery", name: "battery.100"),
]

func croppedPNG(for image: NSImage) -> Data? {
    // NSImage is vector-backed, so render it directly at 4x before inspecting
    // alpha. This keeps the browser from enlarging a 1x AppKit raster on a
    // DPR2/scale-up device; the CSS mask still controls the displayed size.
    // 4.5x clears the old 1x crop's integer rounding while remaining close
    // to the requested 4x output (and well below an accidental 8x render).
    let rasterScale: CGFloat = 4.5
    let pixelsWide = Int(ceil(image.size.width * rasterScale))
    let pixelsHigh = Int(ceil(image.size.height * rasterScale))
    guard let source = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: pixelsWide,
        pixelsHigh: pixelsHigh,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bitmapFormat: .alphaFirst,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ) else { return nil }
    source.size = image.size
    guard let context = NSGraphicsContext(bitmapImageRep: source) else { return nil }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    NSColor.clear.setFill()
    NSRect(origin: .zero, size: image.size).fill()
    image.draw(in: NSRect(origin: .zero, size: image.size), from: .zero, operation: .sourceOver, fraction: 1)
    context.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()

    let width = source.pixelsWide
    let height = source.pixelsHigh
    var minX = width
    var minY = height
    var maxX = -1
    var maxY = -1

    for y in 0..<height {
        for x in 0..<width {
            if (source.colorAt(x: x, y: y)?.alphaComponent ?? 0) > 0.01 {
                minX = min(minX, x)
                minY = min(minY, y)
                maxX = max(maxX, x)
                maxY = max(maxY, y)
            }
        }
    }

    guard maxX >= minX, maxY >= minY else { return nil }
    let cropWidth = maxX - minX + 1
    let cropHeight = maxY - minY + 1
    guard let croppedCGImage = source.cgImage?.cropping(to: CGRect(
        x: minX,
        y: minY,
        width: cropWidth,
        height: cropHeight
    )) else { return nil }
    let cropped = NSBitmapImageRep(cgImage: croppedCGImage)
    return cropped.representation(using: NSBitmapImageRep.FileType.png, properties: [:])
}

for request in requests {
    guard let image = NSImage(systemSymbolName: request.name, accessibilityDescription: nil),
          let png = croppedPNG(for: image) else { continue }
    print("\(request.key)\t\(png.base64EncodedString())")
}
