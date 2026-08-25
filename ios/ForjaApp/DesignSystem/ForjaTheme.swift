import SwiftUI

private struct ForjaReduceMotionKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    var forjaReduceMotion: Bool {
        get { self[ForjaReduceMotionKey.self] }
        set { self[ForjaReduceMotionKey.self] = newValue }
    }
}

enum ForjaTheme {
    static let ink = Color(hex: 0x17130F)
    static let coal = Color(hex: 0x211A16)
    static let coalRaised = Color(hex: 0x30251E)
    static let parchment = Color(hex: 0xF1E1C2)
    static let muted = Color(hex: 0xB9A88D)
    static let ember = Color(hex: 0xE86D32)
    static let gold = Color(hex: 0xE8B84A)
    static let red = Color(hex: 0xB84232)
    static let green = Color(hex: 0x6B9C64)
    static let blue = Color(hex: 0x5C84B6)

    static let pageGradient = LinearGradient(
        colors: [Color(hex: 0x17130F), Color(hex: 0x241A15)],
        startPoint: .top,
        endPoint: .bottom
    )
}

enum ForjaSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 20
    static let xl: CGFloat = 28
}

enum ForjaRadius {
    static let control: CGFloat = 10
    static let card: CGFloat = 14
    static let hero: CGFloat = 20
}

extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

extension Font {
    static var forjaDisplay: Font {
        .system(.largeTitle, design: .rounded, weight: .black)
    }

    static var forjaScreenTitle: Font {
        .system(.title, design: .rounded, weight: .black)
    }

    static var forjaCardTitle: Font {
        .system(.title2, design: .rounded, weight: .bold)
    }

    static var forjaMetric: Font {
        .system(.title2, design: .rounded, weight: .black).monospacedDigit()
    }

    /// Título numérico o de énfasis. El tamaño pedido se mapea a un estilo de texto
    /// para que escale con Dynamic Type en lugar de quedarse fijo.
    static func forjaTitle(_ size: CGFloat = 28) -> Font {
        .system(textStyle(forReferenceSize: size), design: .rounded, weight: .black)
    }

    /// Etiqueta monoespaciada (kickers, pills, cabeceras de grupo). El tamaño pedido
    /// es un tamaño de referencia: se traduce a un estilo de texto escalable.
    static func forjaLabel(_ size: CGFloat = 12) -> Font {
        .system(textStyle(forReferenceSize: size), design: .monospaced, weight: .bold)
    }

    private static func textStyle(forReferenceSize size: CGFloat) -> Font.TextStyle {
        switch size {
        case ..<10: .caption2
        case ..<13: .caption
        case ..<16: .footnote
        case ..<18: .subheadline
        case ..<22: .title3
        case ..<26: .title2
        case ..<32: .title
        default: .largeTitle
        }
    }
}

struct ForjaPage<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        ZStack {
            ForjaTheme.pageGradient.ignoresSafeArea()
            RadialGradient(
                colors: [ForjaTheme.ember.opacity(0.055), .clear],
                center: .topTrailing,
                startRadius: 10,
                endRadius: 360
            )
            .ignoresSafeArea()
            .allowsHitTesting(false)
            content
        }
        .foregroundStyle(ForjaTheme.parchment)
    }
}

struct ForjaCard<Content: View>: View {
    var accent: Color = ForjaTheme.gold.opacity(0.35)
    var prominent = false
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(prominent ? ForjaSpacing.lg : ForjaSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                if prominent {
                    LinearGradient(
                        colors: [ForjaTheme.coalRaised, ForjaTheme.coal],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                } else {
                    ForjaTheme.coalRaised.opacity(0.94)
                }
            }
            .overlay(alignment: .leading) {
                Rectangle().fill(accent).frame(width: prominent ? 4 : 3)
            }
            .clipShape(RoundedRectangle(cornerRadius: prominent ? ForjaRadius.hero : ForjaRadius.card, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: prominent ? ForjaRadius.hero : ForjaRadius.card, style: .continuous)
                    .stroke(ForjaTheme.parchment.opacity(prominent ? 0.16 : 0.1), lineWidth: 1)
            }
            .shadow(color: Color.black.opacity(prominent ? 0.2 : 0), radius: 18, y: 9)
    }
}

struct ForjaSectionTitle: View {
    var kicker: String?
    var title: String
    var detail: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            if let kicker {
                Text(kicker.uppercased())
                    .font(.forjaLabel())
                    .foregroundStyle(ForjaTheme.ember)
            }
            Text(title)
                .font(.forjaScreenTitle)
                .fixedSize(horizontal: false, vertical: true)
            if let detail {
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(ForjaTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

struct ForjaPrimaryButtonStyle: ButtonStyle {
    var tone: Color = ForjaTheme.ember
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.headline, design: .rounded, weight: .bold))
            .multilineTextAlignment(.center)
            .padding(.horizontal, ForjaSpacing.sm)
            .frame(maxWidth: .infinity, minHeight: 52)
            .foregroundStyle(ForjaTheme.ink)
            .background(configuration.isPressed ? tone.opacity(0.72) : tone.opacity(isEnabled ? 1 : 0.42))
            .clipShape(RoundedRectangle(cornerRadius: ForjaRadius.control, style: .continuous))
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(Color.black.opacity(configuration.isPressed ? 0.08 : 0.22))
                    .frame(height: configuration.isPressed ? 1 : 4)
            }
            .opacity(isEnabled ? 1 : 0.72)
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.985 : 1)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct ForjaSecondaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.body, design: .rounded, weight: .semibold))
            .multilineTextAlignment(.center)
            .padding(.horizontal, ForjaSpacing.sm)
            .frame(maxWidth: .infinity, minHeight: 48)
            .foregroundStyle(ForjaTheme.parchment)
            .background(ForjaTheme.coalRaised.opacity(configuration.isPressed ? 0.7 : 1))
            .clipShape(RoundedRectangle(cornerRadius: ForjaRadius.control, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: ForjaRadius.control, style: .continuous)
                    .stroke(ForjaTheme.parchment.opacity(0.18), lineWidth: 1)
            }
            .opacity(isEnabled ? 1 : 0.45)
    }
}

struct ForjaCompactButtonStyle: ButtonStyle {
    var selected = false
    var tone: Color = ForjaTheme.gold
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .multilineTextAlignment(.center)
            .foregroundStyle(selected ? ForjaTheme.ink : ForjaTheme.parchment)
            .frame(minWidth: 44, minHeight: 44)
            .padding(.horizontal, ForjaSpacing.sm)
            .contentShape(Rectangle())
            .background(selected ? tone : ForjaTheme.coalRaised.opacity(configuration.isPressed ? 0.68 : 1))
            .clipShape(RoundedRectangle(cornerRadius: ForjaRadius.control, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: ForjaRadius.control, style: .continuous)
                    .stroke(selected ? tone : ForjaTheme.parchment.opacity(0.14), lineWidth: 1)
            }
            .opacity(isEnabled ? 1 : 0.42)
    }
}

struct ForjaGroupHeader: View {
    var title: String
    var detail: String?

    var body: some View {
        VStack(alignment: .leading, spacing: ForjaSpacing.xxs) {
            Text(title.uppercased())
                .font(.forjaLabel(10))
                .foregroundStyle(ForjaTheme.gold)
            if let detail {
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(ForjaTheme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}

struct ForjaPill: View {
    var text: String
    var color: Color = ForjaTheme.gold

    var body: some View {
        Text(text.uppercased())
            .font(.forjaLabel(10))
            .foregroundStyle(color)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
            .padding(.horizontal, 9)
            .padding(.vertical, 6)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}
