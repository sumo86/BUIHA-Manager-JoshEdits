interface Name {
    firstName: string;
    surname: string;
}

const parseCsvToSurnames = (csvString: string): string[] => {
    const surnames: string[] = [];
    if (!csvString) return surnames;
    const lines = csvString.trim().split('\n');
    const surnameSet = new Set<string>();
    // Skip header line by starting at 1
    for (let i = 1; i < lines.length; i++) {
        const [, surname] = lines[i].split(',');
        if (surname) {
            surnameSet.add(surname.trim());
        }
    }
    return Array.from(surnameSet);
};

const parseCsvToFirstNames = (csvString: string, gender: 'male' | 'female'): string[] => {
    const firstNames: string[] = [];
    if (!csvString) return firstNames;
    const lines = csvString.trim().split('\n');
    const firstNameSet = new Set<string>();
    // Skip header line by starting at 1
    for (let i = 1; i < lines.length; i++) {
        const [firstName] = lines[i].split(',');
        if (firstName) {
            firstNameSet.add(firstName.trim());
        }
    }
    return Array.from(firstNameSet);
};

// --- Male First Names (Curated from CSVs) ---
const maleBritishFirstNames = ["Harry", "Charlie", "Alfie", "Noah", "Oscar", "Leo", "Ethan", "Isaac", "George", "Freddie", "James", "Joshua", "Jacob", "William", "Thomas", "Archie", "Alexander", "Henry", "Jack", "Oliver"];
const maleAmericanFirstNames = ["James", "Noah", "Liam", "Ethan", "Benjamin", "Lucas", "Mason", "Elijah", "Logan", "Aiden", "Jacob", "Jackson", "Owen", "Caleb", "Jayden", "Carter", "Hunter", "Wyatt", "Grayson"];
const maleEuropeanFirstNames = ["Jan", "Leonardo", "Francesco", "Jakub", "Mateo", "Hugo", "Milan", "Louis", "Luuk", "Aleksander", "Szymon", "Daan", "Lorenzo", "Mattia", "Lukas", "Thijs", "Finn", "Nathan", "Elias", "Enzo", "Antoni", "Leo"];
const maleAfricanFirstNames = ["Ayo", "Kofi", "Obinna", "Zuberi", "Juma", "Thabo", "Kwame", "Femi"];
const maleAsianFirstNames = ["Ravi", "Kunal", "Haruto", "Min", "Wei", "Hiroshi", "Sanjay", "Ali", "Jin", "Akira", "Nguyen"];
const maleLatinAmericanFirstNames = ["Martín", "Antonio", "Diego", "Mateo", "José", "Sebastián", "Andrés", "Santiago", "Juan", "Luis", "Gabriel"];

// --- Female First Names (Curated from CSVs) ---
const femaleBritishFirstNames = ["Ava", "Lily", "Alice", "Phoebe", "Rosie", "Chloe", "Millie", "Evie", "Holly", "Matilda", "Grace", "Charlotte", "Florence", "Isabelle", "Poppy", "Ella", "Jessica", "Ruby", "Daisy", "Amelia", "Maisie", "Scarlett", "Erin", "Sophie", "Zoe", "Olivia", "Mia"];
const femaleAmericanFirstNames = ["Emma", "Olivia", "Ava", "Isabella", "Sophia", "Charlotte", "Mia", "Amelia", "Harper", "Evelyn", "Zoe", "Layla", "Aria", "Brooklyn", "Scarlett"];
const femaleEuropeanFirstNames = ["Mila", "Lucía", "Jade", "María", "Julia", "Lena", "Hannah", "Emma", "Sofía", "Alice", "Chloé", "Sophie", "Maja", "Aleksandra", "Tess", "Ginevra", "Lina", "Zuzanna", "Martina", "Aurora", "Sophia", "Giulia", "Louise"];
const femaleAfricanFirstNames = ["Khadija", "Nomsa", "Sibongile", "Ngozi", "Lerato", "Fatou", "Makena", "Mirembe", "Amara", "Chinwe"];
const femaleAsianFirstNames = ["Sakura", "Priya", "Fatima", "Ananya", "Aisha", "Mei", "Yuna", "Nadia"];
const femaleLatinAmericanFirstNames = ["Camila", "Emilia", "Daniela", "Isabella", "Sofía", "María", "Luciana", "Valentina", "Ana"];

// --- Surnames (from CSVs) ---
const britishSurnames = ["Walker", "Harper", "Gray", "Taylor", "Wilson", "Patel", "Morgan", "Mitchell", "Roberts", "Bennett", "Fraser", "Iqbal", "Hall", "Scott", "Khan", "Davies", "Brown", "White", "King", "Cooper", "Wood", "Thomas", "Graham", "Reynolds", "Smith", "Thompson", "Green", "Choudhury", "Simpson", "Bailey", "Johnson", "Turner", "Edwards", "Bell", "Ali", "Price", "Moore", "Hussain", "Clarke", "Williams", "Campbell", "Jones", "Ahmed", "Evans", "Parker", "Morris", "Hughes", "Collins", "Wright"];
const americanSurnames = ["Taylor", "Miller", "Davis", "Thomas", "Johnson", "Hernandez", "Jones", "Martinez", "Rodriguez", "Williams", "Martin", "Moore", "Wilson", "Garcia", "Lopez", "Brown", "Smith", "Jackson", "Anderson", "Gonzalez"];
const canadianSurnames = ["Brown", "Roy", "Smith", "Wilson", "Anderson", "Stewart", "Scott", "Walker", "Gagnon", "Thompson", "Hall", "Young", "Tremblay", "Campbell", "Jones", "Johnson", "Martin", "White", "Taylor", "Lee"];
const europeanSurnames = ["Schneider", "Fischer", "Thomas", "Kowalczyk", "Nowak", "Van den Berg", "Bernard", "De Vries", "Bakker", "Wójcik", "De Jong", "Schmidt", "Martin", "Esposito", "Russo", "Robert", "Müller", "Sánchez", "López", "Ferrari", "Kowalski", "Weber", "Dubois", "Bianchi", "Wiśniewski", "Rossi"];
const africanSurnames = ["Abiola", "Mwangi", "Ngugi", "Mensah", "Tshabalala", "Obasi", "Adeyemi", "Kamara", "Ntuli", "Diallo", "Mutiso", "Chirwa", "Mbatha", "Mabaso", "Osei", "Ajayi", "Okafor", "Banda", "Ncube", "Nzinga"];
const asianSurnames = ["Das", "Sharma", "Hassan", "Pham", "Liu", "Patel", "Wong", "Zhang", "Iqbal", "Abbas", "Khan", "Tanaka", "Chowdhury", "Kim", "Chen", "Yamamoto", "Singh", "Rahman", "Takashi", "Nguyen"];
const latinAmericanSurnames = ["Cruz", "Silva", "Ortega", "Morales", "Hernández", "Rodríguez", "Ramos", "Ramírez", "Martínez", "Sánchez", "Flores", "Castillo", "Torres", "Gómez", "López", "García", "Pérez", "Mendoza", "Delgado", "Vargas"];

// Specific Surnames for better mapping
const chineseSurnames = ["Wong", "Zhang", "Liu", "Chen", "Wei"];
const japaneseSurnames = ["Tanaka", "Yamamoto", "Takashi", "Hiroshi"];
const koreanSurnames = ["Kim", "Park", "Lee"]; // Note: Lee can be Chinese too
const indianSurnames = ["Patel", "Sharma", "Singh", "Das", "Iqbal", "Rahman", "Chowdhury"];
const vietnameseSurnames = ["Nguyen", "Pham"];

// Canadian Names from CSV
const canadianCsv = `First Name,Surname
Jackson,Brown
Grayson,Roy
Jackson,Roy
Scarlett,Smith
Chloe,Wilson
Landon,Anderson
Brooklyn,Stewart
Chloe,Wilson
Ella,Scott
Owen,Stewart
Hunter,Scott
Scarlett,Walker
Brooklyn,Smith
Aria,Brown
Owen,Gagnon
Scarlett,Roy
Jayden,Wilson
Leo,Hall
Lily,Young
Chloe,Tremblay
Jackson,Campbell
Scarlett,Thompson
Jayden,Anderson
Landon,Hall
Aria,Brown
Jayden,Stewart
Caleb,Scott
Zoe,Stewart
Caleb,Jones
Jayden,Johnson
Landon,Martin
Caleb,Johnson
Scarlett,Gagnon
Jackson,Wilson
Carter,Martin
Aria,Gagnon
Leo,White
Aria,Johnson
Scarlett,Jones
Owen,Anderson
Jayden,Gagnon
Sophie,Martin
Lily,Lee
Jayden,Gagnon
Jackson,Taylor
Leo,Tremblay
Hunter,Campbell
Chloe,Taylor
Grayson,White
Caleb,Scott
Zoe,Wilson
Grayson,Scott
Lily,Walker
Lily,Jones
Owen,Wilson
Jackson,Wilson
Leo,Smith
Sophie,Roy
Layla,Taylor
Scarlett,Johnson
Layla,Hall
Aria,Anderson
Owen,Walker
Jackson,Gagnon
Carter,Martin
Wyatt,Anderson
Carter,Martin
Leo,Roy
Lily,Taylor
Layla,Young
Riley,Johnson
Riley,Young
Leo,Stewart
Wyatt,Martin
Lily,Young
Wyatt,Stewart
Hunter,Gagnon
Jayden,Stewart
Leo,Roy
Riley,Campbell
Ella,Campbell
Aria,Hall
Riley,Martin
Jayden,White
Riley,Lee
Landon,Johnson
Caleb,Roy
Wyatt,Anderson
Brooklyn,Brown
Hunter,Stewart
Aria,Young
Carter,Gagnon
Jayden,Johnson
Aria,Smith
Hunter,Anderson
Hunter,Walker
Layla,Hall
Leo,Martin
Leo,Stewart
Carter,Taylor
Jackson,Wilson
Hunter,Martin
Layla,Walker
Aria,Brown
Brooklyn,White
Caleb,Campbell
Caleb,Tremblay
Landon,Johnson
Aria,Smith
Ella,Walker
Grayson,Young
Caleb,Taylor
Sophie,Scott
Chloe,Scott
Brooklyn,Brown
Ella,Scott
Jayden,Thompson
Landon,Scott
Brooklyn,Scott
Leo,Taylor
Ella,Young
Sophie,Thompson
Ella,Martin
Grayson,Young
Caleb,Thompson
Grayson,Wilson
Caleb,Wilson
Riley,Young
Hunter,Young
Grayson,Hall
Grayson,Campbell
Carter,Walker
Brooklyn,Wilson
Sophie,Jones
Zoe,Brown
Lily,Thompson
Jackson,Jones
Lily,Roy
Wyatt,Wilson
Wyatt,Walker
Layla,Stewart
Jayden,Jones
Riley,Campbell
Jayden,Stewart
Brooklyn,Martin
Jackson,Brown
Owen,Hall
Chloe,Anderson
Hunter,Hall
Layla,Roy
Hunter,Walker
Grayson,Smith
Ella,Martin
Aria,Hall
Leo,Anderson
Chloe,Smith
Lily,Johnson
Brooklyn,Roy
Jackson,Smith
Jackson,Martin
Layla,Johnson
Landon,Jones
Hunter,Tremblay
Grayson,Tremblay
Jackson,Martin
Brooklyn,Stewart
Ella,Smith
Jackson,White
Brooklyn,Thompson
Jayden,Hall
Riley,Johnson
Chloe,Taylor
Wyatt,Lee
Sophie,Johnson
Leo,Hall
Landon,Wilson
Lily,Jones
Aria,Smith
Scarlett,Martin
Zoe,Hall
Jackson,Gagnon
Landon,Thompson
Hunter,Young
Jackson,White
Chloe,Jones
Lily,Gagnon
Chloe,Walker
Landon,Roy
Aria,Roy
Grayson,Brown
Hunter,Jones
Riley,Lee
Lily,Anderson
Caleb,Brown
Landon,Gagnon
Ella,Gagnon
Riley,Wilson
Sophie,Roy
Sophie,Jones
Caleb,Hall
Jayden,Young
Caleb,Wilson
Leo,Smith
Riley,Roy
Jayden,Scott
Lily,Campbell
Aria,Johnson
Sophie,Lee
Jackson,Walker
Sophie,Roy
Lily,Stewart
Jayden,Roy
Landon,Gagnon
Sophie,Tremblay
Jackson,Johnson
Zoe,Brown
Jackson,Campbell
Caleb,Jones
Hunter,Johnson
Hunter,Tremblay
Wyatt,Wilson
Wyatt,Walker
Hunter,Scott
Zoe,Brown
Ella,Thompson
Zoe,Gagnon
Scarlett,Stewart
Owen,Campbell
Ella,Lee
Scarlett,Tremblay
Brooklyn,Anderson
Landon,Campbell
Lily,Hall
Lily,Hall
Landon,Roy
Scarlett,Young
Sophie,Jones
Jackson,Hall
Caleb,Smith
Ella,Thompson
Grayson,Anderson
Scarlett,Gagnon
Chloe,Thompson
Wyatt,Jones
Riley,Martin
Landon,Johnson
Sophie,Smith
Aria,Anderson
Sophie,Hall
Owen,Wilson
Caleb,Martin
Sophie,Wilson
Caleb,Johnson
Chloe,Johnson
Scarlett,Smith
Aria,Roy
Zoe,Jones
Jayden,Wilson
Hunter,Martin
Chloe,Wilson
Ella,Jones
Riley,Wilson
Leo,Hall
Landon,Stewart
Caleb,Thompson
Zoe,Jones
Sophie,Jones
Caleb,Wilson
Riley,Hall
Brooklyn,Hall
Scarlett,Scott
Hunter,Brown
Riley,Smith
Leo,Roy
Grayson,Smith
Landon,Scott
Layla,White
Wyatt,Stewart
Grayson,Taylor
Scarlett,Wilson
Caleb,Anderson
Zoe,Brown
Aria,Stewart
Riley,Campbell
Jayden,Martin
Layla,Stewart
Caleb,Jones
Caleb,White
Landon,Lee
Jackson,Roy
Ella,White
Brooklyn,Martin
Landon,Brown
Jayden,Taylor
Aria,Stewart
Wyatt,Stewart
Zoe,Martin
Scarlett,Roy
Zoe,Brown
Landon,Taylor
Scarlett,Taylor
Jackson,Anderson
Carter,Johnson
Leo,Wilson
Jackson,Walker
Jackson,Wilson
Grayson,Brown
Carter,Wilson
Jayden,Brown
Landon,Gagnon
Landon,Scott
Layla,Roy
Chloe,Scott
Scarlett,Brown
Jayden,Hall
Zoe,Young
Brooklyn,Wilson
Hunter,White
Jackson,Roy
Owen,Smith
Chloe,Johnson
Zoe,Stewart
Zoe,Roy
Landon,Smith
Brooklyn,Roy
Owen,Walker
Ella,Young
Caleb,Roy
Layla,Brown
Riley,Young
Brooklyn,Hall
Leo,Roy
Jayden,Hall
Aria,Scott
Jayden,Campbell
Aria,Martin
Layla,Stewart
Caleb,White
Jackson,White
Owen,Campbell
Carter,Scott
Lily,Taylor
Scarlett,Brown
Sophie,Stewart
Jackson,Thompson
Carter,Wilson
Owen,Wilson
Jayden,Taylor
Landon,Martin
Jayden,Martin
Brooklyn,Roy
Ella,Thompson
Leo,Scott
Layla,Young
Riley,Campbell
Caleb,White
Brooklyn,Gagnon
Grayson,Walker
Landon,Tremblay
Grayson,White
Chloe,Lee
Scarlett,Wilson
Wyatt,Gagnon
Carter,Anderson
Sophie,Stewart
Landon,Wilson
Carter,Smith
Zoe,Tremblay
Carter,Smith
Owen,Martin
Riley,Tremblay
Brooklyn,Stewart
Aria,Wilson
Caleb,Roy
Jackson,Hall
Lily,Young
Ella,Gagnon
Riley,Campbell
Owen,Tremblay
Owen,Gagnon
Wyatt,Smith
Caleb,Lee
Aria,Brown
Jayden,Walker
Brooklyn,Young
Aria,Wilson
Riley,Jones
Layla,White
Sophie,Jones
Jayden,Walker
Ella,Roy
Riley,Wilson
Caleb,Campbell
Zoe,Thompson
Caleb,Scott
Zoe,Wilson
Carter,Gagnon
Ella,Tremblay
Leo,Gagnon
Ella,Gagnon
Lily,White
Jayden,Scott
Jackson,Stewart
Grayson,Stewart
Sophie,White
Jayden,Taylor
Jayden,Martin
Landon,Gagnon
Lily,Thompson
Sophie,Anderson
Riley,Roy
Jackson,Tremblay
Aria,Wilson
Wyatt,Tremblay
Zoe,Tremblay
Layla,Brown
Landon,Taylor
Layla,Wilson
Layla,Smith
Scarlett,Stewart
Chloe,Young
Zoe,Thompson
Jackson,Scott
Riley,Thompson
Chloe,Stewart
Brooklyn,Wilson
Jackson,Johnson
Landon,Tremblay
Brooklyn,Anderson
Chloe,Martin
Leo,Taylor
Layla,Jones
Jayden,Campbell
Aria,Smith
Layla,Taylor
Scarlett,Johnson
Layla,White
Sophie,Martin
Aria,Thompson
Caleb,Brown
Jayden,Tremblay
Jackson,Taylor
Grayson,Thompson
Brooklyn,Scott
Lily,Gagnon
Riley,Lee
Wyatt,Hall
Aria,Young
Aria,White
Landon,Hall
Landon,Taylor
Lily,Taylor
Chloe,Anderson
Grayson,Wilson
Sophie,Campbell
Riley,Scott
Jackson,Anderson
Ella,Tremblay
Caleb,Lee
Carter,Stewart
Zoe,Roy
Sophie,Thompson
Grayson,Wilson
Zoe,Young
Caleb,Smith
Carter,Wilson
Ella,Jones
Brooklyn,White
Aria,Scott
Leo,Johnson
Carter,White
Aria,Johnson
Carter,Smith
Wyatt,Taylor
Lily,Wilson
Ella,Campbell
Brooklyn,Martin
Hunter,White
Layla,Johnson
Lily,Wilson
Lily,Smith
Owen,White
Riley,Martin
Scarlett,Roy
Jayden,Scott
Lily,Taylor
Hunter,Campbell
Jackson,Stewart
Wyatt,Brown
Ella,Thompson
Zoe,Young
Lily,Scott
Riley,Gagnon
Scarlett,Thompson
Brooklyn,Martin
Owen,Jones
Landon,Jones
Jackson,Roy
Lily,Martin
Chloe,Thompson`;

const maleCanadianFirstNames = parseCsvToFirstNames(canadianCsv, 'male');
const femaleCanadianFirstNames = parseCsvToFirstNames(canadianCsv, 'female');

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const nameData = {
    English: { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    Scottish: { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    Welsh: { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    'Northern Irish': { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    American: { male: maleAmericanFirstNames, female: femaleAmericanFirstNames, surnames: americanSurnames },
    Canadian: { male: maleCanadianFirstNames, female: femaleCanadianFirstNames, surnames: canadianSurnames },
    German: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    French: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    Czech: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    Slovak: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    Swedish: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    Finnish: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    Latvian: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    Swiss: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames },
    Chinese: { male: maleAsianFirstNames, female: femaleAsianFirstNames, surnames: chineseSurnames },
    Japanese: { male: maleAsianFirstNames, female: femaleAsianFirstNames, surnames: japaneseSurnames },
    Korean: { male: maleAsianFirstNames, female: femaleAsianFirstNames, surnames: koreanSurnames },
    Indian: { male: maleAsianFirstNames, female: femaleAsianFirstNames, surnames: indianSurnames },
    Vietnamese: { male: maleAsianFirstNames, female: femaleAsianFirstNames, surnames: vietnameseSurnames },
    Nigerian: { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    Ghanaian: { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    Kenyan: { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    'South African': { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    Mexican: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
    Brazilian: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
    Argentinian: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
    Colombian: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
};

export const getRandomNameForNationality = (nationality: keyof typeof nameData, gender: 'Male' | 'Female'): string => {
    const nameSet = nameData[nationality];
    if (!nameSet) {
        // Fallback for any unmapped nationalities
        const firstName = gender === 'Male' ? getRandomItem(maleBritishFirstNames) : getRandomItem(femaleBritishFirstNames);
        const surname = getRandomItem(britishSurnames);
        return `${firstName} ${surname}`;
    }

    const firstName = gender === 'Male' ? getRandomItem(nameSet.male) : getRandomItem(nameSet.female);
    const surname = getRandomItem(nameSet.surnames);
    return `${firstName} ${surname}`;
};