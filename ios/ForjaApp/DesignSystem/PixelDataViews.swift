import SwiftUI

struct PixelFlameView: View {
    var intensity: Double
    var size: CGFloat = 72

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 0.4, paused: reduceMotion)) { timeline in
            let tick = Int(timeline.date.timeIntervalSinceReferenceDate * 2) % 2
            Canvas { context, canvasSize in
                let grid: [[Int]] = [
                    [0, 0, 0, 2, 0, 0, 0],
                    [0, 0, 2, 2, 0, 0, 0],
                    [0, 2, 2, 1, 2, 0, 0],
                    [0, 2, 1, 1, 2, 2, 0],
                    [2, 1, 1, 3, 1, 2, 0],
                    [2, 1, 3, 3, 1, 2, 0],
                    [0, 2, 1, 1, 2, 0, 0],
                    [0, 0, 2, 2, 0, 0, 0]
                ]
                let pixel = floor(min(canvasSize.width / 7, canvasSize.height / 8))
                let ox = floor((canvasSize.width - pixel * 7) / 2)
                let oy = floor((canvasSize.height - pixel * 8) / 2) + (tick == 1 ? -1 : 0)
                for (y, row) in grid.enumerated() {
                    for (x, value) in row.enumerated() where value > 0 {
                        let color: Color = switch value {
                        case 1: ForjaTheme.ember
                        case 2: intensity >= 1 ? ForjaTheme.red : ForjaTheme.gold.opacity(0.85)
                        default: ForjaTheme.gold
                        }
                        context.fill(
                            Path(CGRect(x: ox + CGFloat(x) * pixel, y: oy + CGFloat(y) * pixel, width: pixel, height: pixel)),
                            with: .color(color.opacity(max(0.35, intensity)))
                        )
                    }
                }
            }
        }
        .frame(width: size, height: size)
        .accessibilityLabel(intensity >= 1 ? "Llama semanal al rojo" : "Llama semanal en progreso")
    }
}

struct PixelBarDatum: Identifiable, Equatable {
    var id: String { label }
    var label: String
    var value: Double
}

struct PixelBarChart: View {
    var data: [PixelBarDatum]
    var color: Color = ForjaTheme.ember

    var body: some View {
        VStack(spacing: 8) {
            Canvas { context, size in
                guard !data.isEmpty else { return }
                let maximum = max(1, data.map(\.value).max() ?? 1)
                let gap: CGFloat = 6
                let width = max(4, floor((size.width - gap * CGFloat(data.count - 1)) / CGFloat(data.count)))
                for (index, datum) in data.enumerated() {
                    let normalized = datum.value / maximum
                    let rawHeight = size.height * CGFloat(normalized)
                    let height = rawHeight == 0 ? 2 : max(4, floor(rawHeight / 4) * 4)
                    let rect = CGRect(
                        x: CGFloat(index) * (width + gap),
                        y: size.height - height,
                        width: width,
                        height: height
                    )
                    context.fill(Path(rect), with: .color(color.opacity(0.92)))
                    context.fill(
                        Path(CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: min(4, rect.height))),
                        with: .color(ForjaTheme.gold)
                    )
                }
            }
            .frame(height: 130)

            HStack(spacing: 6) {
                ForEach(data) { datum in
                    Text(datum.label)
                        .font(.forjaLabel(8))
                        .foregroundStyle(ForjaTheme.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(data.map { "\($0.label): \(Int($0.value))" }.joined(separator: ", "))
    }
}
