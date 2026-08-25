import SwiftUI

struct AvatarStudioView: View {
    @Binding var avatar: AvatarConfiguration
    var compact = false

    @State private var category: AvatarCategory = .body

    var body: some View {
        VStack(spacing: ForjaSpacing.md) {
            preview
            categoryPicker
            activeEditor
        }
    }

    private var preview: some View {
        ZStack {
            RoundedRectangle(cornerRadius: ForjaRadius.hero, style: .continuous)
                .fill(
                    RadialGradient(
                        colors: [auraColor.opacity(0.28), ForjaTheme.coal],
                        center: .center,
                        startRadius: 8,
                        endRadius: 180
                    )
                )
            Ellipse()
                .fill(Color.black.opacity(0.28))
                .frame(width: compact ? 92 : 120, height: 18)
                .offset(y: compact ? 69 : 83)
            PixelAvatarView(avatar: avatar, label: "Vista previa del avatar")
                .frame(width: compact ? 96 : 120, height: compact ? 144 : 180)
        }
        .frame(height: compact ? 184 : 220)
        .overlay(alignment: .topLeading) {
            VStack(alignment: .leading, spacing: 2) {
                Text("TU FORJADOR")
                    .font(.forjaLabel(9))
                    .foregroundStyle(ForjaTheme.gold)
                Text(selectionSummary)
                    .font(.caption)
                    .foregroundStyle(ForjaTheme.muted)
                    .lineLimit(1)
            }
            .padding(ForjaSpacing.sm)
        }
        .overlay(alignment: .topTrailing) {
            Button {
                randomize()
            } label: {
                Label("Aleatorio", systemImage: "dice.fill")
                    .labelStyle(.iconOnly)
            }
            .buttonStyle(ForjaCompactButtonStyle())
            .accessibilityLabel("Crear una combinación aleatoria")
            .padding(ForjaSpacing.xs)
        }
        .overlay {
            RoundedRectangle(cornerRadius: ForjaRadius.hero, style: .continuous)
                .stroke(ForjaTheme.parchment.opacity(0.12), lineWidth: 1)
        }
    }

    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ForjaSpacing.xs) {
                ForEach(AvatarCategory.allCases) { item in
                    Button {
                        withAnimation(.snappy) { category = item }
                    } label: {
                        Label(item.title, systemImage: item.icon)
                    }
                    .buttonStyle(
                        ForjaCompactButtonStyle(
                            selected: category == item,
                            tone: ForjaTheme.gold
                        )
                    )
                    .accessibilityAddTraits(category == item ? .isSelected : [])
                }
            }
            .padding(.horizontal, 1)
            .padding(.vertical, 2)
        }
    }

    @ViewBuilder
    private var activeEditor: some View {
        ForjaCard(accent: category.color) {
            VStack(alignment: .leading, spacing: ForjaSpacing.md) {
                ForjaGroupHeader(title: category.title, detail: category.detail)
                switch category {
                case .body:
                    optionGrid(values: AvatarBody.allCases, selection: $avatar.body, title: \.title)
                    colorGrid(options: AvatarPalette.skin, selection: $avatar.skinToneID)
                case .hair:
                    optionGrid(values: AvatarHair.allCases, selection: $avatar.hair, title: \.title)
                    colorGrid(options: AvatarPalette.hair, selection: $avatar.hairColorID)
                case .outfit:
                    optionGrid(values: AvatarOutfit.allCases, selection: $avatar.outfit, title: \.title)
                    colorGrid(options: AvatarPalette.cloth, selection: $avatar.outfitColorID)
                case .armor:
                    optionGrid(values: AvatarArmor.allCases, selection: $avatar.armor, title: \.title)
                case .accessory:
                    optionGrid(values: AvatarAccessory.allCases, selection: $avatar.accessory, title: \.title)
                case .aura:
                    optionGrid(values: AvatarAura.allCases, selection: $avatar.aura, title: \.title)
                }
            }
        }
    }

    private func optionGrid<Value: Hashable & Identifiable>(
        values: [Value],
        selection: Binding<Value>,
        title: KeyPath<Value, String>
    ) -> some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: ForjaSpacing.xs)], spacing: ForjaSpacing.xs) {
            ForEach(values) { value in
                Button {
                    selection.wrappedValue = value
                } label: {
                    HStack(spacing: ForjaSpacing.xs) {
                        Image(systemName: selection.wrappedValue == value ? "checkmark.circle.fill" : "circle")
                        Text(value[keyPath: title])
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                        Spacer(minLength: 0)
                    }
                }
                .buttonStyle(
                    ForjaCompactButtonStyle(
                        selected: selection.wrappedValue == value,
                        tone: ForjaTheme.gold
                    )
                )
                .accessibilityAddTraits(selection.wrappedValue == value ? .isSelected : [])
            }
        }
    }

    private func colorGrid(
        options: [(String, String, Color)],
        selection: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: ForjaSpacing.xs) {
            Text("COLOR")
                .font(.forjaLabel(9))
                .foregroundStyle(ForjaTheme.muted)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 68), spacing: ForjaSpacing.xs)], spacing: ForjaSpacing.sm) {
                ForEach(options, id: \.0) { id, name, color in
                    Button {
                        selection.wrappedValue = id
                    } label: {
                        VStack(spacing: 7) {
                            Circle()
                                .fill(color)
                                .frame(width: 36, height: 36)
                                .overlay {
                                    Circle()
                                        .stroke(
                                            selection.wrappedValue == id ? ForjaTheme.parchment : Color.clear,
                                            lineWidth: 3
                                        )
                                        .padding(-4)
                                }
                            Text(name)
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(ForjaTheme.parchment)
                                .lineLimit(1)
                                .minimumScaleFactor(0.75)
                        }
                        .frame(maxWidth: .infinity, minHeight: 64)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(name)
                    .accessibilityAddTraits(selection.wrappedValue == id ? .isSelected : [])
                }
            }
        }
    }

    private var auraColor: Color {
        switch avatar.aura {
        case .none: ForjaTheme.gold
        case .ember: ForjaTheme.ember
        case .frost: Color(hex: 0x70C8D8)
        case .storm: Color(hex: 0xCEB8FF)
        case .arcane: Color(hex: 0xB75DCC)
        }
    }

    private var selectionSummary: String {
        "\(avatar.body.title) · \(avatar.hair.title) · \(avatar.outfit.title)"
    }

    private func randomize() {
        avatar.body = AvatarBody.allCases.randomElement() ?? avatar.body
        avatar.skinToneID = AvatarPalette.skin.randomElement()?.0 ?? avatar.skinToneID
        avatar.hair = AvatarHair.allCases.randomElement() ?? avatar.hair
        avatar.hairColorID = AvatarPalette.hair.randomElement()?.0 ?? avatar.hairColorID
        avatar.outfit = AvatarOutfit.allCases.randomElement() ?? avatar.outfit
        avatar.outfitColorID = AvatarPalette.cloth.randomElement()?.0 ?? avatar.outfitColorID
        avatar.armor = AvatarArmor.allCases.randomElement() ?? avatar.armor
        avatar.accessory = AvatarAccessory.allCases.randomElement() ?? avatar.accessory
        avatar.aura = AvatarAura.allCases.randomElement() ?? avatar.aura
    }
}

private enum AvatarCategory: String, CaseIterable, Identifiable {
    case body
    case hair
    case outfit
    case armor
    case accessory
    case aura

    var id: String { rawValue }

    var title: String {
        switch self {
        case .body: "Cuerpo y piel"
        case .hair: "Pelo"
        case .outfit: "Ropa"
        case .armor: "Armadura"
        case .accessory: "Detalle"
        case .aura: "Aura"
        }
    }

    var detail: String {
        switch self {
        case .body: "Elige una silueta y un tono de piel. Ninguna opción cambia tus capacidades."
        case .hair: "Forma y color se guardan como capas independientes."
        case .outfit: "La vestimenta define el tono visual de tu personaje."
        case .armor: "Es puramente cosmética y no representa fuerza real."
        case .accessory: "Un rasgo pequeño para distinguir tu avatar a simple vista."
        case .aura: "Un efecto opcional para los momentos de campaña."
        }
    }

    var icon: String {
        switch self {
        case .body: "figure.stand"
        case .hair: "scissors"
        case .outfit: "tshirt.fill"
        case .armor: "shield.fill"
        case .accessory: "sparkles"
        case .aura: "flame.fill"
        }
    }

    var color: Color {
        switch self {
        case .body, .outfit: ForjaTheme.gold
        case .hair, .armor: ForjaTheme.ember
        case .accessory: ForjaTheme.blue
        case .aura: Color(hex: 0xB75DCC)
        }
    }
}
