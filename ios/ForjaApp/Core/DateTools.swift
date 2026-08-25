import Foundation

public enum ForjaDate {
    public static func startOfDay(_ date: Date, calendar: Calendar = .current) -> Date {
        calendar.startOfDay(for: date)
    }

    public static func dateKey(_ date: Date, calendar: Calendar = .current) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d",
            parts.year ?? 0,
            parts.month ?? 0,
            parts.day ?? 0
        )
    }

    public static func date(from key: String, calendar: Calendar = .current) -> Date? {
        let values = key.split(separator: "-").compactMap { Int($0) }
        guard values.count == 3 else { return nil }
        return calendar.date(from: DateComponents(year: values[0], month: values[1], day: values[2]))
    }

    public static func monday(of date: Date, calendar: Calendar = .current) -> Date {
        let day = calendar.startOfDay(for: date)
        let appleWeekday = calendar.component(.weekday, from: day)
        let daysSinceMonday = appleWeekday == 1 ? 6 : appleWeekday - 2
        return calendar.date(byAdding: .day, value: -daysSinceMonday, to: day) ?? day
    }

    public static func campaignWeek(start: Date, on date: Date, calendar: Calendar = .current) -> Int {
        let firstMonday = monday(of: start, calendar: calendar)
        let targetMonday = monday(of: date, calendar: calendar)
        let days = calendar.dateComponents([.day], from: firstMonday, to: targetMonday).day ?? 0
        return max(1, days / 7 + 1)
    }

    public static func addingDays(_ count: Int, to date: Date, calendar: Calendar = .current) -> Date {
        calendar.date(byAdding: .day, value: count, to: date) ?? date
    }
}
