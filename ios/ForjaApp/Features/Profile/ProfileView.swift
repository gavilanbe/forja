import SwiftUI
import UniformTypeIdentifiers

struct ProfileView: View {
    @EnvironmentObject private var model: AppModel
    @State private var showingEditor = false
    @State private var showingNewProfile = false
    @State private var showingDelete = false
    @State private var showingExporter = false
    @State private var showingImporter = false
    @State private var showingImportConfirmation = false
    @State private var exportDocument: ForjaBackupDocument?
    @State private var pendingImportData: Data?

    private var profile: UserProfile? { model.activeProfile }

    var body: some View {
        ForjaPage {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    profileHeader
                    profileSwitcher
                    preferences
                    dataControls
                    privacyNote
                    deleteControl
                }
                .padding(18)
            }
        }
        .navigationTitle("Perfil")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
        .sheet(isPresented: $showingEditor) {
            if let profile {
                ProfileEditorView(profile: profile) { updated in
                    if await model.updateProfile(updated) { showingEditor = false }
                }
            }
        }
        .fullScreenCover(isPresented: $showingNewProfile) {
            OnboardingFlow(
                onFinished: { showingNewProfile = false },
                onCancel: { showingNewProfile = false }
            )
        }
        .fileExporter(
            isPresented: $showingExporter,
            document: exportDocument,
            contentType: .json,
            defaultFilename: "forja-copia-\(ForjaDate.dateKey(Date()))"
        ) { result in
            if case let .failure(error) = result { model.presentedError = error.localizedDescription }
            exportDocument = nil
        }
        .fileImporter(isPresented: $showingImporter, allowedContentTypes: [.json]) { result in
            switch result {
            case let .success(url):
                let access = url.startAccessingSecurityScopedResource()
                defer { if access { url.stopAccessingSecurityScopedResource() } }
                do {
                    let data = try Data(contentsOf: url)
                    pendingImportData = data
                    showingImportConfirmation = true
                } catch {
                    model.presentedError = error.localizedDescription
                }
            case let .failure(error):
                model.presentedError = error.localizedDescription
            }
        }
        .alert(
            "Copia importada",
            isPresented: Binding(
                get: { model.importMessage != nil },
                set: { if !$0 { model.importMessage = nil } }
            )
        ) {
            Button("Entendido") { model.importMessage = nil }
        } message: {
            Text(model.importMessage ?? "")
        }
        .confirmationDialog("¿Sustituir los datos de este iPhone?", isPresented: $showingImportConfirmation) {
            Button("Importar y sustituir", role: .destructive) {
                if let pendingImportData {
                    Task { _ = await model.importBackup(pendingImportData) }
                }
                pendingImportData = nil
            }
            Button("Cancelar", role: .cancel) { pendingImportData = nil }
        } message: {
            Text("La copia reemplazará todos los perfiles y sesiones locales. Exporta primero si necesitas conservar el estado actual.")
        }
        .confirmationDialog("Eliminar este perfil", isPresented: $showingDelete) {
            if let profile {
                Button("Eliminar a \(profile.name) definitivamente", role: .destructive) {
                    Task { _ = await model.deleteProfile(profile.id) }
                }
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("Sus sesiones, series y personalización se eliminarán del dispositivo. Exporta una copia antes si quieres conservarlas.")
        }
    }

    @ViewBuilder
    private var profileHeader: some View {
        if let profile {
            let level = GameRules.level(for: profile.xp)
            ForjaCard(accent: ForjaTheme.ember, prominent: true) {
                HStack(alignment: .center, spacing: ForjaSpacing.md) {
                    ZStack {
                        RoundedRectangle(cornerRadius: ForjaRadius.card)
                            .fill(ForjaTheme.ember.opacity(0.12))
                        PixelAvatarView(avatar: profile.avatar, label: "Avatar de \(profile.name)")
                            .padding(8)
                    }
                    .frame(width: 82, height: 112)

                    VStack(alignment: .leading, spacing: ForjaSpacing.xs) {
                        Text(profile.name)
                            .font(.forjaCardTitle)
                            .lineLimit(2)
                        Text("Nv. \(level.level) · \(level.title)")
                            .font(.subheadline)
                            .foregroundStyle(ForjaTheme.gold)
                        ProgressView(value: level.progress)
                            .tint(ForjaTheme.gold)
                            .accessibilityLabel("Progreso hacia el siguiente nivel")
                        ViewThatFits(in: .horizontal) {
                            HStack(spacing: 6) {
                                ForjaPill(text: profile.goal.title, color: ForjaTheme.ember)
                                ForjaPill(text: "\(profile.daysPerWeek) días", color: ForjaTheme.blue)
                            }
                            VStack(alignment: .leading, spacing: 5) {
                                ForjaPill(text: profile.goal.title, color: ForjaTheme.ember)
                                ForjaPill(text: "\(profile.daysPerWeek) días", color: ForjaTheme.blue)
                            }
                        }
                        Button("Editar perfil y avatar") { showingEditor = true }
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(ForjaTheme.parchment)
                            .frame(minHeight: 44)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var profileSwitcher: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("FORJADORES EN ESTE IPHONE").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
                Spacer()
                Button {
                    showingNewProfile = true
                } label: {
                    Label("Añadir", systemImage: "plus")
                }
                .font(.caption.weight(.semibold))
            }
            ForEach(model.database.profiles) { candidate in
                Button {
                    Task { await model.selectProfile(candidate.id) }
                } label: {
                    HStack(spacing: 12) {
                        PixelAvatarView(avatar: candidate.avatar, animate: false, label: "Avatar de \(candidate.name)")
                            .frame(width: 48, height: 72)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(candidate.name).font(.headline)
                            Text("\(candidate.daysPerWeek) días · \(candidate.goal.title)")
                                .font(.caption)
                                .foregroundStyle(ForjaTheme.muted)
                        }
                        Spacer()
                        if candidate.id == profile?.id {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(ForjaTheme.green)
                        }
                    }
                    .padding(12)
                    .background(ForjaTheme.coalRaised)
                    .clipShape(RoundedRectangle(cornerRadius: 11))
                    .contentShape(RoundedRectangle(cornerRadius: 11))
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(candidate.id == profile?.id ? .isSelected : [])
                .accessibilityHint(candidate.id == profile?.id ? "Forjador activo" : "Cambia al forjador \(candidate.name)")
            }
        }
    }

    @ViewBuilder
    private var preferences: some View {
        if let profile {
            VStack(alignment: .leading, spacing: 10) {
                Text("IPHONE Y ENTRENAMIENTO").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
                preferenceToggle(
                    title: "Hápticos",
                    detail: "Confirmación física al guardar una serie.",
                    icon: "iphone.radiowaves.left.and.right",
                    value: profile.preferences.hapticsEnabled
                ) { value in update(profile) { $0.preferences.hapticsEnabled = value } }
                preferenceToggle(
                    title: "Aviso al terminar el descanso",
                    detail: "Notificación local; no necesita servidor.",
                    icon: "bell.badge.fill",
                    value: profile.preferences.restNotificationsEnabled
                ) { value in update(profile) { $0.preferences.restNotificationsEnabled = value } }
                preferenceToggle(
                    title: "Mantener pantalla encendida",
                    detail: "Solo durante una misión activa.",
                    icon: "sun.max.fill",
                    value: profile.preferences.keepScreenAwake
                ) { value in update(profile) { $0.preferences.keepScreenAwake = value } }
                preferenceToggle(
                    title: "Reducir movimiento",
                    detail: "Además de respetar el ajuste del sistema.",
                    icon: "figure.walk.motion",
                    value: profile.preferences.reducedMotion
                ) { value in update(profile) { $0.preferences.reducedMotion = value } }
            }
        }
    }

    private func preferenceToggle(
        title: String,
        detail: String,
        icon: String,
        value: Bool,
        onChange: @escaping (Bool) -> Void
    ) -> some View {
        Toggle(isOn: Binding(get: { value }, set: onChange)) {
            HStack(alignment: .top, spacing: 11) {
                Image(systemName: icon).foregroundStyle(ForjaTheme.ember).frame(width: 24)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.headline)
                    Text(detail).font(.caption).foregroundStyle(ForjaTheme.muted)
                }
            }
        }
        .tint(ForjaTheme.ember)
        .padding(13)
        .background(ForjaTheme.coalRaised)
        .clipShape(RoundedRectangle(cornerRadius: 11))
    }

    private var dataControls: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("TUS DATOS").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
            Button {
                Task {
                    exportDocument = await model.exportBackup()
                    showingExporter = exportDocument != nil
                }
            } label: {
                Label("Exportar copia JSON", systemImage: "square.and.arrow.up")
            }
            .buttonStyle(ForjaSecondaryButtonStyle())

            Button {
                showingImporter = true
            } label: {
                Label("Importar FORJA web o iOS", systemImage: "square.and.arrow.down")
            }
            .buttonStyle(ForjaSecondaryButtonStyle())
        }
    }

    private var privacyNote: some View {
        ForjaCard(accent: ForjaTheme.green) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "lock.shield.fill").foregroundStyle(ForjaTheme.green)
                VStack(alignment: .leading, spacing: 5) {
                    Text("Solo en este iPhone").font(.headline)
                    Text("Sin cuenta, analítica ni nube. Guardamos un archivo protegido en el dispositivo. La exportación siempre la inicias tú.")
                        .font(.caption)
                        .foregroundStyle(ForjaTheme.muted)
                }
            }
        }
    }

    private var deleteControl: some View {
        Button(role: .destructive) {
            showingDelete = true
        } label: {
            Text("Eliminar este perfil")
                .frame(maxWidth: .infinity, minHeight: 48)
        }
        .foregroundStyle(ForjaTheme.red)
    }

    private func update(_ profile: UserProfile, mutation: (inout UserProfile) -> Void) {
        var updated = profile
        mutation(&updated)
        Task { _ = await model.updateProfile(updated) }
    }
}

private struct ProfileEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var draft: UserProfile
    let onSave: (UserProfile) async -> Void

    init(profile: UserProfile, onSave: @escaping (UserProfile) async -> Void) {
        _draft = State(initialValue: profile)
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            ForjaPage {
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        ForjaSectionTitle(
                            kicker: "Tu forjador",
                            title: "Personalización",
                            detail: "Los cambios de aspecto no alteran tu progreso."
                        )
                        TextField("Nombre", text: $draft.name)
                            .textInputAutocapitalization(.words)
                            .autocorrectionDisabled()
                            .font(.title3.weight(.semibold))
                            .padding(14)
                            .background(ForjaTheme.coalRaised)
                            .clipShape(RoundedRectangle(cornerRadius: 11))

                        Text("OBJETIVO").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
                        Picker("Objetivo", selection: $draft.goal) {
                            ForEach(TrainingGoal.allCases) { Text($0.title).tag($0) }
                        }
                        .pickerStyle(.menu)
                        .tint(ForjaTheme.gold)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(ForjaTheme.coalRaised)
                        .clipShape(RoundedRectangle(cornerRadius: 11))

                        Text("EXPERIENCIA Y LUGAR").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
                        Picker("Experiencia", selection: $draft.experience) {
                            ForEach(ExperienceLevel.allCases) { Text($0.title).tag($0) }
                        }
                        .pickerStyle(.menu)
                        .tint(ForjaTheme.gold)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(ForjaTheme.coalRaised)
                        .clipShape(RoundedRectangle(cornerRadius: 11))

                        Picker("Lugar", selection: $draft.trainingPlace) {
                            ForEach(TrainingPlace.allCases) { Text($0.title).tag($0) }
                        }
                        .pickerStyle(.segmented)

                        if draft.trainingPlace != .gym {
                            Label(
                                "La rutina base sigue siendo de gimnasio. Consulta alternativas en el Códice antes de entrenar en casa.",
                                systemImage: "info.circle.fill"
                            )
                            .font(.caption)
                            .foregroundStyle(ForjaTheme.gold)
                        }

                        scheduleEditor

                        AvatarStudioView(avatar: $draft.avatar, compact: true)
                    }
                    .padding(18)
                    .padding(.bottom, 90)
                }
                .scrollDismissesKeyboard(.interactively)
            }
            .navigationTitle("Editar perfil")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancelar") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") { Task { await onSave(draft) } }
                        .disabled(
                            draft.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                                Set(draft.preferredDays).count != draft.daysPerWeek
                        )
                }
            }
        }
    }

    private var scheduleEditor: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("TU SEMANA").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.gold)
            HStack(spacing: 9) {
                ForEach(3...5, id: \.self) { count in
                    Button {
                        draft.daysPerWeek = count
                        draft.preferredDays = defaultDays(count)
                    } label: {
                        Text("\(count) días")
                            .font(.headline)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .frame(maxWidth: .infinity, minHeight: 46)
                            .foregroundStyle(draft.daysPerWeek == count ? ForjaTheme.ink : ForjaTheme.parchment)
                            .background(draft.daysPerWeek == count ? ForjaTheme.gold : ForjaTheme.coalRaised)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .contentShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(count) días por semana")
                    .accessibilityAddTraits(draft.daysPerWeek == count ? .isSelected : [])
                }
            }

            HStack(spacing: 7) {
                ForEach(Weekday.allCases) { weekday in
                    let selected = draft.preferredDays.contains(weekday)
                    Button {
                        toggle(weekday)
                    } label: {
                        Text(weekday.shortTitle)
                            .font(.system(.body, design: .monospaced, weight: .bold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .foregroundStyle(selected ? ForjaTheme.ink : ForjaTheme.parchment)
                            .background(selected ? ForjaTheme.ember : ForjaTheme.coalRaised)
                            .clipShape(RoundedRectangle(cornerRadius: 9))
                            .contentShape(RoundedRectangle(cornerRadius: 9))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(weekday.title)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }

            Text("\(draft.preferredDays.count) de \(draft.daysPerWeek) días elegidos")
                .font(.caption)
                .foregroundStyle(draft.preferredDays.count == draft.daysPerWeek ? ForjaTheme.green : ForjaTheme.red)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Duración orientativa").font(.headline)
                    Spacer()
                    Text("\(draft.preferredSessionMinutes) min")
                        .font(.headline.monospacedDigit())
                        .foregroundStyle(ForjaTheme.gold)
                }
                Slider(
                    value: Binding(
                        get: { Double(draft.preferredSessionMinutes) },
                        set: { draft.preferredSessionMinutes = Int($0.rounded() / 5) * 5 }
                    ),
                    in: 45...120,
                    step: 5
                )
                .tint(ForjaTheme.ember)
                .accessibilityLabel("Duración orientativa")
                .accessibilityValue("\(draft.preferredSessionMinutes) minutos")
            }
            .padding(13)
            .background(ForjaTheme.coalRaised)
            .clipShape(RoundedRectangle(cornerRadius: 10))

            Text("Al guardar, la distribución semanal cambia desde este momento. Las sesiones ya registradas no se modifican y la duración no recorta series automáticamente.")
                .font(.caption)
                .foregroundStyle(ForjaTheme.muted)
        }
    }

    private func toggle(_ weekday: Weekday) {
        if let index = draft.preferredDays.firstIndex(of: weekday) {
            draft.preferredDays.remove(at: index)
        } else if draft.preferredDays.count < draft.daysPerWeek {
            draft.preferredDays.append(weekday)
            draft.preferredDays.sort { $0.rawValue < $1.rawValue }
        }
    }

    private func defaultDays(_ count: Int) -> [Weekday] {
        switch count {
        case 3: [.monday, .wednesday, .friday]
        case 4: [.monday, .tuesday, .thursday, .saturday]
        default: [.monday, .tuesday, .thursday, .friday, .saturday]
        }
    }
}
