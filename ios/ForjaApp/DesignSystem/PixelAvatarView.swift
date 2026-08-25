import SwiftUI

enum AvatarPalette {
    static let skin: [(String, String, Color)] = [
        ("skin-01", "Porcelana", Color(hex: 0xF5CEB3)),
        ("skin-02", "Arena", Color(hex: 0xDFA77F)),
        ("skin-03", "Ámbar", Color(hex: 0xB97850)),
        ("skin-04", "Cobre", Color(hex: 0x8B5238)),
        ("skin-05", "Ébano", Color(hex: 0x593426))
    ]

    static let hair: [(String, String, Color)] = [
        ("hair-01", "Azabache", Color(hex: 0x171419)),
        ("hair-02", "Castaño", Color(hex: 0x513128)),
        ("hair-03", "Rubio", Color(hex: 0xD7A84B)),
        ("hair-04", "Cobrizo", Color(hex: 0xA8462E)),
        ("hair-05", "Plata", Color(hex: 0xAEB7BE)),
        ("hair-06", "Arcano", Color(hex: 0x6E4E99))
    ]

    static let cloth: [(String, String, Color)] = [
        ("cloth-ember", "Brasa", Color(hex: 0xC84D2F)),
        ("cloth-gold", "Oro viejo", Color(hex: 0xC99B3B)),
        ("cloth-forest", "Bosque", Color(hex: 0x426B4A)),
        ("cloth-ocean", "Océano", Color(hex: 0x3F628B)),
        ("cloth-violet", "Arcano", Color(hex: 0x6F4B84)),
        ("cloth-ash", "Ceniza", Color(hex: 0x69665F))
    ]

    static func skinColor(_ id: String) -> Color {
        skin.first(where: { $0.0 == id })?.2 ?? skin[2].2
    }

    static func hairColor(_ id: String) -> Color {
        hair.first(where: { $0.0 == id })?.2 ?? hair[1].2
    }

    static func clothColor(_ id: String) -> Color {
        cloth.first(where: { $0.0 == id })?.2 ?? cloth[0].2
    }
}

struct PixelAvatarView: View {
    var avatar: AvatarConfiguration
    var animate = true
    var label = "Avatar del forjador"

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.forjaReduceMotion) private var appReduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 0.45, paused: !animate || reduceMotion || appReduceMotion)) { timeline in
            let tick = Int(timeline.date.timeIntervalSinceReferenceDate * 2) % 2
            Canvas(opaque: false, rendersAsynchronously: true) { context, size in
                drawAvatar(in: &context, size: size, tick: tick)
            }
        }
        .aspectRatio(16 / 24, contentMode: .fit)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
    }

    private func drawAvatar(in context: inout GraphicsContext, size: CGSize, tick: Int) {
        let columns: CGFloat = 16
        let rows: CGFloat = 24
        let pixel = max(1, floor(min(size.width / columns, size.height / rows)))
        let origin = CGPoint(
            x: floor((size.width - columns * pixel) / 2),
            y: floor((size.height - rows * pixel) / 2)
        )
        let bounce = animate && !reduceMotion && !appReduceMotion && tick == 1 ? -pixel : 0

        func rect(_ x: Int, _ y: Int, _ width: Int = 1, _ height: Int = 1, _ color: Color) {
            context.fill(
                Path(
                    CGRect(
                        x: origin.x + CGFloat(x) * pixel,
                        y: origin.y + CGFloat(y) * pixel + bounce,
                        width: CGFloat(width) * pixel,
                        height: CGFloat(height) * pixel
                    )
                ),
                with: .color(color)
            )
        }

        let skin = AvatarPalette.skinColor(avatar.skinToneID)
        let shadow = skin.opacity(0.72)
        let hair = AvatarPalette.hairColor(avatar.hairColorID)
        let cloth = AvatarPalette.clothColor(avatar.outfitColorID)
        let outline = Color(hex: 0x17130F)
        let metal: Color = switch avatar.armor {
        case .none: cloth
        case .leather: Color(hex: 0x6B432D)
        case .iron: Color(hex: 0x89929A)
        case .obsidian: Color(hex: 0x332A42)
        }

        if avatar.aura != .none {
            let auraColor: Color = switch avatar.aura {
            case .none: .clear
            case .ember: ForjaTheme.ember
            case .frost: Color(hex: 0x70C8D8)
            case .storm: Color(hex: 0xCEB8FF)
            case .arcane: Color(hex: 0xB75DCC)
            }
            for point in [(2, 7), (13, 8), (1, 14), (14, 16), (4, 21), (12, 20)] {
                if (point.0 + point.1 + tick).isMultiple(of: 2) {
                    rect(point.0, point.1, 1, 1, auraColor.opacity(0.75))
                }
            }
        }

        // Sombra y botas.
        rect(4, 23, 8, 1, Color.black.opacity(0.35))
        rect(5, 20, 2, 3, outline)
        rect(9, 20, 2, 3, outline)
        rect(4, 22, 3, 1, Color(hex: 0x392A24))
        rect(9, 22, 3, 1, Color(hex: 0x392A24))

        // Silueta corporal variable.
        let torsoX: Int
        let torsoWidth: Int
        switch avatar.body {
        case .agile: (torsoX, torsoWidth) = (6, 4)
        case .athletic: (torsoX, torsoWidth) = (5, 6)
        case .strong: (torsoX, torsoWidth) = (4, 8)
        case .broad: (torsoX, torsoWidth) = (3, 10)
        }
        rect(torsoX - 1, 10, torsoWidth + 2, 8, outline)
        rect(torsoX, 10, torsoWidth, 7, cloth)
        rect(5, 17, 6, 3, Color(hex: 0x433A47))
        rect(7, 17, 2, 3, Color(hex: 0x2B2630))

        // Brazos y manos.
        rect(max(1, torsoX - 2), 11, 2, 6, outline)
        rect(min(13, torsoX + torsoWidth), 11, 2, 6, outline)
        rect(max(2, torsoX - 1), 12, 1, 4, skin)
        rect(min(13, torsoX + torsoWidth), 12, 1, 4, skin)
        rect(max(2, torsoX - 1), 16, 1, 1, shadow)
        rect(min(13, torsoX + torsoWidth), 16, 1, 1, shadow)

        // Armadura como capa independiente.
        if avatar.armor != .none {
            rect(torsoX, 10, torsoWidth, 2, metal)
            rect(torsoX + 1, 12, max(2, torsoWidth - 2), 3, metal.opacity(0.88))
            rect(torsoX, 15, torsoWidth, 1, outline.opacity(0.75))
            rect(7, 11, 2, 1, ForjaTheme.gold.opacity(0.85))
        }

        // Cabeza.
        rect(5, 2, 6, 8, outline)
        rect(6, 3, 4, 6, skin)
        rect(5, 5, 1, 2, skin)
        rect(10, 5, 1, 2, skin)
        rect(6, 8, 4, 1, shadow)
        rect(7, 6, 1, 1, outline)
        rect(9, 6, 1, 1, outline)

        // Pelo por capas. Los IDs se mantendrán al reemplazar por sprites.
        switch avatar.hair {
        case .cropped:
            rect(6, 2, 4, 2, hair)
            rect(5, 3, 1, 2, hair)
        case .fade:
            rect(6, 2, 5, 2, hair)
            rect(9, 1, 2, 1, hair)
        case .curls:
            for point in [(5, 2), (7, 1), (9, 1), (10, 3), (6, 3), (8, 2)] {
                rect(point.0, point.1, 2, 2, hair)
            }
        case .long:
            rect(5, 2, 6, 3, hair)
            rect(5, 4, 1, 6, hair)
            rect(10, 4, 1, 6, hair)
        case .bun:
            rect(5, 2, 6, 3, hair)
            rect(7, 0, 3, 2, hair)
        case .shaved:
            rect(6, 2, 4, 1, hair.opacity(0.55))
        }

        switch avatar.accessory {
        case .none:
            break
        case .headband:
            rect(5, 4, 6, 1, ForjaTheme.red)
        case .glasses:
            rect(6, 5, 2, 2, Color(hex: 0x75A3B7))
            rect(9, 5, 2, 2, Color(hex: 0x75A3B7))
            rect(8, 6, 1, 1, outline)
        case .earring:
            rect(10, 7, 1, 1, ForjaTheme.gold)
        case .scar:
            rect(9, 5, 1, 2, ForjaTheme.red.opacity(0.8))
        }
    }
}

extension AvatarBody {
    var title: String {
        switch self {
        case .agile: "Ágil"
        case .athletic: "Atlético"
        case .strong: "Fuerte"
        case .broad: "Robusto"
        }
    }
}

extension AvatarHair {
    var title: String {
        switch self {
        case .cropped: "Corto"
        case .fade: "Degradado"
        case .curls: "Rizos"
        case .long: "Largo"
        case .bun: "Recogido"
        case .shaved: "Rapado"
        }
    }
}

extension AvatarOutfit {
    var title: String {
        switch self {
        case .training: "Entreno"
        case .smith: "Herrero"
        case .ranger: "Explorador"
        case .mage: "Arcano"
        }
    }
}

extension AvatarArmor {
    var title: String {
        switch self {
        case .none: "Sin armadura"
        case .leather: "Cuero"
        case .iron: "Hierro"
        case .obsidian: "Obsidiana"
        }
    }
}

extension AvatarAccessory {
    var title: String {
        switch self {
        case .none: "Ninguno"
        case .headband: "Cinta"
        case .glasses: "Gafas"
        case .earring: "Pendiente"
        case .scar: "Cicatriz"
        }
    }
}

extension AvatarAura {
    var title: String {
        switch self {
        case .none: "Sin aura"
        case .ember: "Brasa"
        case .frost: "Escarcha"
        case .storm: "Tormenta"
        case .arcane: "Arcana"
        }
    }
}
