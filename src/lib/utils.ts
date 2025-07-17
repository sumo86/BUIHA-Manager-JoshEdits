import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { GameDate } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];

export const getSeasonString = (date: GameDate): string => {
    const { month, year } = date;
    const monthIndex = months.indexOf(month);
    // Season starts in August. If the month is August-December, the season is year to year+1.
    // Otherwise (Jan-July), the season is year-1 to year.
    if (monthIndex >= 0 && monthIndex <= 4) { // August to December
        return `${year}-${year + 1}`;
    } else { // January to July
        return `${year - 1}-${year}`;
    }
};