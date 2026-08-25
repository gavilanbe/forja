import SwiftUI

struct CodexView: View {
    @EnvironmentObject private var model: AppModel
    @State private var search = ""

    private var filtered: [ExerciseGuide] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return model.guides }
        return model.guides.filter {
            $0.name.localizedCaseInsensitiveContains(query) ||
                $0.muscles.localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        ForjaPage {
            List {
                Section {
                    ForjaCard(accent: ForjaTheme.blue) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("MANUAL DE CAMPO").font(.forjaLabel(10)).foregroundStyle(ForjaTheme.blue)
                            Text("Técnica antes que carga").font(.title3.weight(.bold))
                            Text("\(model.guides.count) ejercicios con colocación, ejecución, errores y alternativas del manual original.")
                                .font(.caption)
                                .foregroundStyle(ForjaTheme.muted)
                        }
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }

                Section {
                    if filtered.isEmpty {
                        ContentUnavailableView.search(text: search)
                            .foregroundStyle(ForjaTheme.muted)
                            .listRowBackground(Color.clear)
                    } else {
                        ForEach(filtered) { guide in
                            NavigationLink {
                                CodexDetailView(guide: guide)
                            } label: {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(guide.name).font(.headline)
                                    Text(guide.muscles)
                                        .font(.caption)
                                        .foregroundStyle(ForjaTheme.gold)
                                    Text(guide.rationale)
                                        .font(.caption)
                                        .foregroundStyle(ForjaTheme.muted)
                                        .lineLimit(2)
                                }
                                .padding(.vertical, 6)
                            }
                            .listRowBackground(ForjaTheme.coalRaised)
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .searchable(text: $search, prompt: "Ejercicio o músculo")
            .autocorrectionDisabled()
        }
        .navigationTitle("Códice")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
    }
}

private struct CodexDetailView: View {
    let guide: ExerciseGuide

    var body: some View {
        ForjaPage {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    ForjaSectionTitle(kicker: guide.muscles, title: guide.name, detail: guide.rationale)
                    section("Colocación", values: guide.setup, color: ForjaTheme.blue)
                    section("Ejecución", values: guide.execution, color: ForjaTheme.green)
                    section("Errores frecuentes", values: guide.mistakes, color: ForjaTheme.red)
                    section("Alternativas", values: guide.alternatives, color: ForjaTheme.gold)
                    Text("Este manual organiza el entrenamiento; no diagnostica ni sustituye una valoración sanitaria o fisioterapéutica.")
                        .font(.caption)
                        .foregroundStyle(ForjaTheme.muted)
                }
                .padding(18)
            }
        }
        .navigationTitle(guide.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(ForjaTheme.coal, for: .navigationBar)
    }

    private func section(_ title: String, values: [String], color: Color) -> some View {
        ForjaCard(accent: color) {
            VStack(alignment: .leading, spacing: 11) {
                Text(title.uppercased()).font(.forjaLabel(10)).foregroundStyle(color)
                ForEach(Array(values.enumerated()), id: \.offset) { index, value in
                    HStack(alignment: .top, spacing: 10) {
                        Text("\(index + 1)").font(.forjaLabel(9)).foregroundStyle(color)
                        Text(value).font(.subheadline)
                    }
                }
            }
        }
    }
}
