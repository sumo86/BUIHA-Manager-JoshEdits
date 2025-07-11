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
        const [firstName, , genderCsv] = lines[i].split(',');
        if (firstName && genderCsv && genderCsv.trim().toLowerCase() === gender) {
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
const canadianCsv = `First Name,Surname,Gender
Jackson,Brown,male
Grayson,Roy,male
Jackson,Roy,male
Scarlett,Smith,female
Chloe,Wilson,female
Landon,Anderson,male
Brooklyn,Stewart,female
Chloe,Wilson,female
Ella,Scott,female
Owen,Stewart,male
Hunter,Scott,male
Scarlett,Walker,female
Brooklyn,Smith,female
Aria,Brown,female
Owen,Gagnon,male
Scarlett,Roy,female
Jayden,Wilson,male
Leo,Hall,male
Lily,Young,female
Chloe,Tremblay,female
Jackson,Campbell,male
Scarlett,Thompson,female
Jayden,Anderson,male
Landon,Hall,male
Aria,Brown,female
Jayden,Stewart,male
Caleb,Scott,male
Zoe,Stewart,female
Caleb,Jones,male
Jayden,Johnson,male
Landon,Martin,male
Caleb,Johnson,male
Scarlett,Gagnon,female
Jackson,Wilson,male
Carter,Martin,male
Aria,Gagnon,female
Leo,White,male
Aria,Johnson,female
Scarlett,Jones,female
Owen,Anderson,male
Jayden,Gagnon,male
Sophie,Martin,female
Lily,Lee,female
Jayden,Gagnon,male
Jackson,Taylor,male
Leo,Tremblay,male
Hunter,Campbell,male
Chloe,Taylor,female
Grayson,White,male
Caleb,Scott,male
Zoe,Wilson,female
Grayson,Scott,male
Lily,Walker,female
Lily,Jones,female
Owen,Wilson,male
Jackson,Wilson,male
Leo,Smith,male
Sophie,Roy,female
Layla,Taylor,female
Scarlett,Johnson,female
Layla,Hall,female
Aria,Anderson,female
Owen,Walker,male
Jackson,Gagnon,male
Carter,Martin,male
Wyatt,Anderson,male
Carter,Martin,male
Leo,Roy,male
Lily,Taylor,female
Layla,Young,female
Riley,Johnson,female
Riley,Young,female
Leo,Stewart,male
Wyatt,Martin,male
Lily,Young,female
Wyatt,Stewart,male
Hunter,Gagnon,male
Jayden,Stewart,male
Leo,Roy,male
Riley,Campbell,female
Ella,Campbell,female
Aria,Hall,female
Riley,Martin,female
Jayden,White,male
Riley,Lee,female
Landon,Johnson,male
Caleb,Roy,male
Wyatt,Anderson,male
Brooklyn,Brown,female
Hunter,Stewart,male
Aria,Young,female
Carter,Gagnon,male
Jayden,Johnson,male
Aria,Smith,female
Hunter,Anderson,male
Hunter,Walker,male
Layla,Hall,female
Leo,Martin,male
Leo,Stewart,male
Carter,Taylor,male
Jackson,Wilson,male
Hunter,Martin,male
Layla,Walker,female
Aria,Brown,female
Brooklyn,White,female
Caleb,Campbell,male
Caleb,Tremblay,male
Landon,Johnson,male
Aria,Smith,female
Ella,Walker,female
Grayson,Young,male
Caleb,Taylor,male
Sophie,Scott,female
Chloe,Scott,female
Brooklyn,Brown,female
Ella,Scott,female
Jayden,Thompson,male
Landon,Scott,male
Brooklyn,Scott,female
Leo,Taylor,male
Ella,Young,female
Sophie,Thompson,female
Ella,Martin,female
Grayson,Young,male
Caleb,Thompson,male
Grayson,Wilson,male
Caleb,Wilson,male
Riley,Young,female
Hunter,Young,male
Grayson,Hall,male
Grayson,Campbell,male
Carter,Walker,male
Brooklyn,Wilson,female
Sophie,Jones,female
Zoe,Brown,female
Lily,Thompson,female
Jackson,Jones,male
Lily,Roy,female
Wyatt,Wilson,male
Wyatt,Walker,male
Layla,Stewart,female
Jayden,Jones,male
Riley,Campbell,female
Jayden,Stewart,male
Brooklyn,Martin,female
Jackson,Brown,male
Owen,Hall,male
Chloe,Anderson,female
Hunter,Hall,male
Layla,Roy,female
Hunter,Walker,male
Grayson,Smith,male
Ella,Martin,female
Aria,Hall,female
Leo,Anderson,male
Chloe,Smith,female
Lily,Johnson,female
Brooklyn,Roy,female
Jackson,Smith,male
Jackson,Martin,male
Layla,Johnson,female
Landon,Jones,male
Hunter,Tremblay,male
Grayson,Tremblay,male
Jackson,Martin,male
Brooklyn,Stewart,female
Ella,Smith,female
Jackson,White,male
Brooklyn,Thompson,female
Jayden,Hall,male
Riley,Johnson,female
Chloe,Taylor,female
Wyatt,Lee,male
Sophie,Johnson,female
Leo,Hall,male
Landon,Wilson,male
Lily,Jones,female
Aria,Smith,female
Scarlett,Martin,female
Zoe,Hall,female
Jackson,Gagnon,male
Landon,Thompson,male
Hunter,Young,male
Jackson,White,male
Chloe,Jones,female
Lily,Gagnon,female
Chloe,Walker,female
Landon,Roy,male
Aria,Roy,female
Grayson,Brown,male
Hunter,Jones,male
Riley,Lee,female
Lily,Anderson,female
Caleb,Brown,male
Landon,Gagnon,male
Ella,Gagnon,female
Riley,Wilson,female
Sophie,Roy,female
Sophie,Jones,female
Caleb,Hall,male
Jayden,Young,male
Caleb,Wilson,male
Leo,Smith,male
Riley,Roy,female
Jayden,Scott,male
Lily,Campbell,female
Aria,Johnson,female
Sophie,Lee,female
Jackson,Walker,male
Sophie,Roy,female
Lily,Stewart,female
Jayden,Roy,male
Landon,Gagnon,male
Sophie,Tremblay,female
Jackson,Johnson,male
Zoe,Brown,female
Jackson,Campbell,male
Caleb,Jones,male
Hunter,Johnson,male
Hunter,Tremblay,male
Wyatt,Wilson,male
Wyatt,Walker,male
Hunter,Scott,male
Zoe,Brown,female
Ella,Thompson,female
Zoe,Gagnon,female
Scarlett,Stewart,female
Owen,Campbell,male
Ella,Lee,female
Scarlett,Tremblay,female
Brooklyn,Anderson,female
Landon,Campbell,male
Lily,Hall,female
Lily,Hall,female
Landon,Roy,male
Scarlett,Young,female
Sophie,Jones,female
Jackson,Hall,male
Caleb,Smith,male
Ella,Thompson,female
Grayson,Anderson,male
Scarlett,Gagnon,female
Chloe,Thompson,female
Wyatt,Jones,male
Riley,Martin,female
Landon,Johnson,male
Sophie,Smith,female
Aria,Anderson,female
Sophie,Hall,female
Owen,Wilson,male
Caleb,Martin,male
Sophie,Wilson,female
Caleb,Johnson,male
Chloe,Johnson,female
Scarlett,Smith,female
Aria,Roy,female
Zoe,Jones,female
Jayden,Wilson,male
Hunter,Martin,male
Chloe,Wilson,female
Ella,Jones,female
Riley,Wilson,female
Leo,Hall,male
Landon,Stewart,male
Caleb,Thompson,male
Zoe,Jones,female
Sophie,Jones,female
Caleb,Wilson,male
Riley,Hall,female
Brooklyn,Hall,female
Scarlett,Scott,female
Hunter,Brown,male
Riley,Smith,female
Leo,Roy,male
Grayson,Smith,male
Landon,Scott,male
Layla,White,female
Wyatt,Stewart,male
Grayson,Taylor,male
Scarlett,Wilson,female
Caleb,Anderson,male
Zoe,Brown,female
Aria,Stewart,female
Riley,Campbell,female
Jayden,Martin,male
Layla,Stewart,female
Caleb,Jones,male
Caleb,White,male
Landon,Lee,male
Jackson,Roy,male
Ella,White,female
Brooklyn,Martin,female
Landon,Brown,male
Jayden,Taylor,male
Aria,Stewart,female
Wyatt,Stewart,male
Zoe,Martin,female
Scarlett,Roy,female
Zoe,Brown,female
Landon,Taylor,male
Scarlett,Taylor,female
Jackson,Anderson,male
Carter,Johnson,male
Leo,Wilson,male
Jackson,Walker,male
Jackson,Wilson,male
Grayson,Brown,male
Carter,Wilson,male
Jayden,Brown,male
Landon,Gagnon,male
Landon,Scott,male
Layla,Roy,female
Chloe,Scott,female
Scarlett,Brown,female
Jayden,Hall,male
Zoe,Young,female
Brooklyn,Wilson,female
Hunter,White,male
Jackson,Roy,male
Owen,Smith,male
Chloe,Johnson,female
Zoe,Stewart,female
Zoe,Roy,female
Landon,Smith,male
Brooklyn,Roy,female
Owen,Walker,male
Ella,Young,female
Caleb,Roy,male
Layla,Brown,female
Riley,Young,female
Brooklyn,Hall,female
Leo,Roy,male
Jayden,Hall,male
Aria,Scott,female
Jayden,Campbell,male
Aria,Martin,female
Layla,Stewart,female
Caleb,White,male
Jackson,White,male
Owen,Campbell,male
Carter,Scott,male
Lily,Taylor,female
Scarlett,Brown,female
Sophie,Stewart,female
Jackson,Thompson,male
Carter,Wilson,male
Owen,Wilson,male
Jayden,Taylor,male
Landon,Martin,male
Jayden,Martin,male
Brooklyn,Roy,female
Ella,Thompson,female
Leo,Scott,male
Layla,Young,female
Riley,Campbell,female
Caleb,White,male
Brooklyn,Gagnon,female
Grayson,Walker,male
Landon,Tremblay,male
Grayson,White,male
Chloe,Lee,female
Scarlett,Wilson,female
Wyatt,Gagnon,male
Carter,Anderson,male
Sophie,Stewart,female
Landon,Wilson,male
Carter,Smith,male
Zoe,Tremblay,female
Carter,Smith,male
Owen,Martin,male
Riley,Tremblay,female
Brooklyn,Stewart,female
Aria,Wilson,female
Caleb,Roy,male
Jackson,Hall,male
Lily,Young,female
Ella,Gagnon,female
Riley,Campbell,female
Owen,Tremblay,male
Owen,Gagnon,male
Wyatt,Smith,male
Caleb,Lee,male
Aria,Brown,female
Jayden,Walker,male
Brooklyn,Young,female
Aria,Wilson,female
Riley,Jones,female
Layla,White,female
Sophie,Jones,female
Jayden,Walker,male
Ella,Roy,female
Riley,Wilson,female
Caleb,Campbell,male
Zoe,Thompson,female
Caleb,Scott,male
Zoe,Wilson,female
Carter,Gagnon,male
Ella,Tremblay,female
Leo,Gagnon,male
Ella,Gagnon,female
Lily,White,female
Jayden,Scott,male
Jackson,Stewart,male
Grayson,Stewart,male
Sophie,White,female
Jayden,Taylor,male
Jayden,Martin,male
Landon,Gagnon,male
Lily,Thompson,female
Sophie,Anderson,female
Riley,Roy,female
Jackson,Tremblay,male
Aria,Wilson,female
Wyatt,Tremblay,male
Zoe,Tremblay,female
Layla,Brown,female
Landon,Taylor,male
Layla,Wilson,female
Layla,Smith,female
Scarlett,Stewart,female
Chloe,Young,female
Zoe,Thompson,female
Jackson,Scott,male
Riley,Thompson,female
Chloe,Stewart,female
Brooklyn,Wilson,female
Jackson,Johnson,male
Landon,Tremblay,male
Brooklyn,Anderson,female
Chloe,Martin,female
Leo,Taylor,male
Layla,Jones,female
Jayden,Campbell,male
Aria,Smith,female
Layla,Taylor,female
Scarlett,Johnson,female
Layla,White,female
Sophie,Martin,female
Aria,Thompson,female
Caleb,Brown,male
Jayden,Tremblay,male
Jackson,Taylor,male
Grayson,Thompson,male
Brooklyn,Scott,female
Lily,Gagnon,female
Riley,Lee,female
Wyatt,Hall,male
Aria,Young,female
Aria,White,female
Landon,Hall,male
Landon,Taylor,male
Lily,Taylor,female
Chloe,Anderson,female
Grayson,Wilson,male
Sophie,Campbell,female
Riley,Scott,female
Jackson,Anderson,male
Ella,Tremblay,female
Caleb,Lee,male
Carter,Stewart,male
Zoe,Roy,female
Sophie,Thompson,female
Grayson,Wilson,male
Zoe,Young,female
Caleb,Smith,male
Carter,Wilson,male
Ella,Jones,female
Brooklyn,White,female
Aria,Scott,female
Leo,Johnson,male
Carter,White,male
Aria,Johnson,female
Carter,Smith,male
Wyatt,Taylor,male
Lily,Wilson,female
Ella,Campbell,female
Brooklyn,Martin,female
Hunter,White,male
Layla,Johnson,female
Lily,Wilson,female
Lily,Smith,female
Owen,White,male
Riley,Martin,female
Scarlett,Roy,female
Jayden,Scott,male
Lily,Taylor,female
Hunter,Campbell,male
Jackson,Stewart,male
Wyatt,Brown,male
Ella,Thompson,female
Zoe,Young,female
Lily,Scott,female
Riley,Gagnon,female
Scarlett,Thompson,female
Brooklyn,Martin,female
Owen,Jones,male
Landon,Jones,male
Jackson,Roy,male
Lily,Martin,female
Chloe,Thompson,female`;

const maleCanadianFirstNames = parseCsvToFirstNames(canadianCsv, 'male');
const femaleCanadianFirstNames = parseCsvToFirstNames(canadianCsv, 'female');

// New CSVs
const austriaCsv = `First Name,Surname,Gender
Lukas,Müller,male
Anna,Schmidt,female
David,Wagner,male
Lena,Fischer,female
Felix,Weber,male
Sophie,Mayer,female
Maximilian,Huber,male
Emilia,Leitner,female
Paul,Berger,male
Laura,Gruber,female
Jakob,Moser,male
Sarah,Schwarz,female
Leon,Steiner,male
Julia,Bauer,female
Noah,Probst,male
Hannah,Eder,female
Elias,Hofer,male
Marie,Fuchs,female
Jonas,Wimmer,male
Valentina,Koller,female
Moritz,Brandl,male
Katharina,Wallner,female
Tobias,Schuster,male
Lisa,Haas,female
Alexander,Egger,male
Victoria,Pichler,female
Daniel,Reiter,male
Amelie,Binder,female
Fabian,Ebner,male
Johanna,Lang,female
Julian,Schmid,male
Theresa,Maier,female
Simon,Auer,male
Elena,Winkler,female
Valentin,Gassner,male
Nina,Schulz,female
Sebastian,Koch,male
Mia,Seidl,female
Raphael,Forster,male
Lara,Hammer,female
Ben,Strobl,male
Lena,Schmid,female
Leo,Moser,male
Anna,Huber,female
Felix,Wagner,male
Sophie,Müller,female
David,Fischer,male
Emilia,Weber,female
Lukas,Mayer,male
Laura,Schmidt,female`;
const maleAustrianFirstNames = parseCsvToFirstNames(austriaCsv, 'male');
const femaleAustrianFirstNames = parseCsvToFirstNames(austriaCsv, 'female');
const austrianSurnames = parseCsvToSurnames(austriaCsv);

const russiaCsv = `First Name,Surname,Gender
Ivan,Smirnov,male
Maria,Ivanova,female
Alexander,Kuznetsov,male
Anastasia,Popova,female
Sergei,Sokolov,male
Elena,Volkova,female
Dmitry,Novikov,male
Natalia,Lebedeva,female
Andrei,Kozlov,male
Olga,Morozova,female
Nikolai,Petrov,male
Anna,Frolova,female
Vladimir,Mikhailov,male
Ekaterina,Vasileva,female
Alexey,Fedorov,male
Irina,Zakharova,female
Pavel,Semenov,male
Svetlana,Orlova,female
Maxim,Bogdanov,male
Tatiana,Andreeva,female
Artyom,Sergeev,male
Yulia,Makarova,female
Roman,Titov,male
Viktoria,Kovaleva,female
Yuri,Egorov,male
Daria,Antipova,female
Gleb,Kuzmin,male
Polina,Kiseleva,female
Kirill,Komarov,male
Alina,Guseva,female
Anton,Krylov,male
Vera,Zaitseva,female
Boris,Markov,male
Lyudmila,Solovyova,female
Victor,Vinogradov,male
Galina,Kozlova,female
Gennady,Vorobyov,male
Nadezhda,Sidorova,female
Konstantin,Pavlov,male
Zoya,Belova,female
Oleg,Ryabov,male
Larisa,Kuzmina,female
Ruslan,Alekseev,male
Margarita,Ivanova,female
Denis,Nikitin,male
Sofya,Smirnova,female
Igor,Volkov,male
Viktoria,Popova,female
Arina,Kuznetsova,female
Artem,Smirnov,male`;
const maleRussianFirstNames = parseCsvToFirstNames(russiaCsv, 'male');
const femaleRussianFirstNames = parseCsvToFirstNames(russiaCsv, 'female');
const russianSurnames = parseCsvToSurnames(russiaCsv);

const indiaCsv = `First Name,Surname,Gender
Rahul,Sharma,male
Priya,Singh,female
Amit,Kumar,male
Neha,Patel,female
Sanjay,Das,male
Pooja,Gupta,female
Rajesh,Yadav,male
Anjali,Jain,female
Vikas,Reddy,male
Deepika,Mehta,female
Arjun,Choudhury,male
Kavita,Khan,female
Gaurav,Verma,male
Shweta,Dubey,female
Vivek,Malhotra,male
Ritu,Agarwal,female
Ashish,Srivastava,male
Divya,Sharma,female
Manish,Tiwari,male
Swati,Singh,female
Alok,Mishra,male
Shruti,Patel,female
Naveen,Garg,male
Kiran,Kumar,female
Saurabh,Joshi,male
Meena,Gupta,female
Prashant,Pandey,male
Rachna,Yadav,female
Sumit,Saxena,male
Preeti,Jain,female
Rohit,Bansal,male
Ankita,Reddy,female
Ajay,Chopra,male
Sonia,Mehta,female
Dinesh,Thakur,male
Nisha,Choudhury,female
Harish,Pal,male
Seema,Khan,female
Mukesh,Rana,male
Vandana,Verma,female
Pankaj,Rawat,male
Arti,Dubey,female
Sandeep,Negi,male
Priyanka,Malhotra,female
Vinod,Bisht,male
Jyoti,Agarwal,female
Ravi,Sharma,male
Ananya,Singh,female
Kunal,Kumar,male
Aisha,Patel,female`;
const maleIndianFirstNames = parseCsvToFirstNames(indiaCsv, 'male');
const femaleIndianFirstNames = parseCsvToFirstNames(indiaCsv, 'female');
const indianSurnamesNew = parseCsvToSurnames(indiaCsv); // Renamed to avoid conflict

const taiwanCsv = `First Name,Surname,Gender
Wei,Chen,male
Ting,Lin,female
Chun,Huang,male
Yu,Chang,female
Ming,Wang,male
Hui,Lee,female
Po,Wu,male
Yi,Liu,female
Cheng,Kuo,male
Shu,Tsai,female
Chih,Yang,male
Pei,Chou,female
Jen,Yeh,male
Fang,Hsu,female
Kuan,Chiang,male
Ya,Cheng,female
Sheng,Liao,male
Ching,Shih,female
Hao,Pan,male
Mei,Ko,female
Li,Hung,male
Hsin,Kao,female
Yen,Chuang,male
Tzu,Lien,female
Pin,Chen,male
Wan,Lin,female
Kai,Huang,male
Jo,Chang,female
Chien,Wang,male
Yun,Lee,female
Chun,Wu,male
I,Liu,female
Yu,Kuo,male
Hsiu,Tsai,female
Ming,Yang,male
Chih,Chou,female
Jen,Yeh,male
Fang,Hsu,female
Kuan,Chiang,male
Ya,Cheng,female
Sheng,Liao,male
Ching,Shih,female
Hao,Pan,male
Mei,Ko,female
Li,Hung,male
Hsin,Kao,female
Yen,Chuang,male
Tzu,Lien,female
Pin,Chen,male
Wan,Lin,female`;
const maleTaiwanFirstNames = parseCsvToFirstNames(taiwanCsv, 'male');
const femaleTaiwanFirstNames = parseCsvToFirstNames(taiwanCsv, 'female');
const taiwanSurnames = parseCsvToSurnames(taiwanCsv);

const newZealandCsv = `First Name,Surname,Gender
Liam,Smith,male
Olivia,Williams,female
Noah,Brown,male
Charlotte,Jones,female
Oliver,Wilson,male
Amelia,Taylor,female
Elijah,Davis,male
Ava,Moore,female
James,White,male
Sophia,Martin,female
William,Anderson,male
Isabella,Thomas,female
Benjamin,Jackson,male
Mia,Harris,female
Lucas,Clark,male
Harper,Lewis,female
Mason,Walker,male
Evelyn,Hall,female
Ethan,Wright,male
Abigail,Green,female
Alexander,King,male
Emily,Baker,female
Henry,Hill,male
Elizabeth,Adams,female
Jacob,Campbell,male
Sofia,Nelson,female
Daniel,Mitchell,male
Ella,Carter,female
Michael,Roberts,male
Grace,Phillips,female
Samuel,Turner,male
Chloe,Edwards,female
David,Stewart,male
Victoria,Collins,female
Joseph,Kelly,male
Scarlett,Rogers,female
Matthew,Parker,male
Zoey,Reed,female
Jackson,Cook,male
Layla,Morgan,female
Sebastian,Bell,male
Hannah,Cooper,female
Leo,Murphy,male
Lily,Bailey,female
Owen,Cox,male
Nora,Howard,female
Wyatt,Ward,male
Zoe,Brooks,female
Caleb,Watson,male
Mila,Gray,female`;
const maleNewZealandFirstNames = parseCsvToFirstNames(newZealandCsv, 'male');
const femaleNewZealandFirstNames = parseCsvToFirstNames(newZealandCsv, 'female');
const newZealandSurnames = parseCsvToSurnames(newZealandCsv);

const australiaCsv = `First Name,Surname,Gender
Oliver,Smith,male
Charlotte,Jones,female
Noah,Williams,male
Olivia,Brown,female
Jack,Wilson,male
Amelia,Taylor,female
William,Davis,male
Ava,Moore,female
Leo,White,male
Mia,Martin,female
Lucas,Anderson,male
Isabella,Thomas,female
Thomas,Jackson,male
Sophia,Harris,female
James,Clark,male
Grace,Lewis,female
Henry,Walker,male
Chloe,Hall,female
Ethan,Wright,male
Emily,Green,female
Alexander,King,male
Harper,Baker,female
Samuel,Hill,male
EElla,Adams,female
Daniel,Campbell,male
Abigail,Nelson,female
Benjamin,Mitchell,male
Sofia,Carter,female
Joseph,Roberts,male
Elizabeth,Phillips,female
Matthew,Turner,male
Scarlett,Edwards,female
David,Stewart,male
Victoria,Collins,female
Jackson,Kelly,male
Zoey,Rogers,female
Sebastian,Parker,male
Layla,Reed,female
Liam,Cook,male
Hannah,Morgan,female
Owen,Bell,male
Lily,Cooper,female
Caleb,Murphy,male
Nora,Bailey,female
Wyatt,Cox,male
Zoe,Howard,female
Elijah,Ward,male
Mila,Brooks,female
Hunter,Watson,male
Aria,Gray,female`;
const maleAustraliaFirstNames = parseCsvToFirstNames(australiaCsv, 'male');
const femaleAustraliaFirstNames = parseCsvToFirstNames(australiaCsv, 'female');
const australiaSurnames = parseCsvToSurnames(australiaCsv);

const vietnamCsv = `First Name,Surname,Gender
Minh,Nguyen,male
Anh,Tran,female
Tuan,Le,male
Thi,Pham,female
Long,Hoang,male
Huong,Huynh,female
Duy,Phan,male
Thuy,Vo,female
Khoa,Dang,male
Ngoc,Bui,female
Viet,Do,male
Linh,Ngo,female
Huy,Duong,male
Mai,Ly,female
Quang,Vu,male
Loan,Nguyen,female
Thanh,Tran,male
Ha,Le,female
Son,Pham,male
Yen,Hoang,female
Duc,Huynh,male
Diep,Phan,female
Hoang,Vo,male
Thao,Dang,female
Nam,Bui,male
Trang,Do,female
Tien,Ngo,male
Van,Duong,female
Phuong,Ly,male
Hien,Vu,female
Cong,Nguyen,male
Xuan,Tran,female
Manh,Le,male
Thu,Pham,female
Kien,Hoang,male
Dao,Huynh,female
Hieu,Phan,male
Hong,Vo,female
Trung,Dang,male
Cam,Bui,female
Dung,Do,male
Thanh,Ngo,female
Tung,Duong,male
Thuy,Ly,female
Cuong,Vu,male
Nguyet,Nguyen,female
Khanh,Tran,male
Quynh,Le,female
Dat,Pham,male
Lan,Hoang,female`;
const maleVietnamFirstNames = parseCsvToFirstNames(vietnamCsv, 'male');
const femaleVietnamFirstNames = parseCsvToFirstNames(vietnamCsv, 'female');
const vietnamSurnamesNew = parseCsvToSurnames(vietnamCsv); // Renamed to avoid conflict

const hongKongCsv = `First Name,Surname,Gender
Ka-lok,Chan,male
Man-yee,Wong,female
Chi-ho,Lee,male
Sze-man,Cheung,female
Chun-kit,Leung,male
Wing-kei,Kwok,female
Wai-kit,Lam,male
Pui-yee,Lau,female
Ho-yin,Ng,male
Yan-yan,Chow,female
Kin-wah,Chan,male
Mei-ling,Wong,female
Chung-man,Lee,male
Ka-yee,Cheung,female
Tsz-kin,Leung,male
Sze-nga,Kwok,female
Chun-fai,Lam,male
Pui-shan,Lau,female
Ho-cheung,Ng,male
Yan-ting,Chow,female
Kwok-leung,Chan,male
Mei-wah,Wong,female
Chung-yin,Lee,male
Ka-yan,Cheung,female
Tsz-lok,Leung,male
Sze-wing,Kwok,female
Chun-wai,Lam,male
Pui-ting,Lau,female
Ho-man,Ng,male
Yan-ki,Chow,female
Kin-man,Chan,male
Mei-chun,Wong,female
Chung-kit,Lee,male
Ka-man,Cheung,female
Tsz-ho,Leung,male
Sze-lok,Kwok,female
Chun-lok,Lam,male
Pui-yiu,Lau,female
Ho-ming,Ng,male
Yan-yiu,Chow,female
Kwok-fai,Chan,male
Mei-yee,Wong,female
Chung-ho,Lee,male
Ka-lok,Cheung,female
Tsz-wai,Leung,male
Sze-yee,Kwok,female
Chun-yiu,Lam,male
Pui-man,Lau,female
Ho-ting,Ng,male
Yan-lok,Chow,female`;
const maleHongKongFirstNames = parseCsvToFirstNames(hongKongCsv, 'male');
const femaleHongKongFirstNames = parseCsvToFirstNames(hongKongCsv, 'female');
const hongKongSurnames = parseCsvToSurnames(hongKongCsv);

const japanCsv = `First Name,Surname,Gender
Ren,Sato,male
Yui,Suzuki,female
Haruto,Takahashi,male
Hina,Tanaka,female
Sota,Watanabe,male
Aoi,Ito,female
Yuto,Nakamura,male
Riko,Kobayashi,female
Hinata,Yamamoto,male
Sakura,Kato,female
Kaito,Yoshida,male
Mei,Yamada,female
Riku,Sasaki,male
Koharu,Matsumoto,female
Shota,Inoue,male
Yuna,Kimura,female
Ryota,Saito,male
Mio,Hayashi,female
Yuki,Shimizu,male
Sora,Mori,female
Daiki,Abe,male
Nana,Yamaguchi,female
Takumi,Ikeda,male
Ayaka,Fukuda,female
Kazuki,Hashimoto,male
Yuzuki,Ishikawa,female
Toma,Yamashita,male
Akari,Nakajima,female
Koki,Ogawa,male
Karen,Maeda,female
Yuma,Okada,male
Rin,Fujita,female
Shun,Goto,male
Yui,Kondo,female
Fuma,Hasegawa,male
Miku,Saito,female
Hiroto,Murakami,male
Yua,Sato,female
Sora,Suzuki,male
Hina,Takahashi,female
Yuto,Tanaka,male
Aoi,Watanabe,female
Kaito,Ito,male
Riko,Nakamura,female
Shota,Kobayashi,male
Sakura,Yamamoto,female
Ryota,Kato,male
Mei,Yoshida,female
Yuki,Yamada,male
Koharu,Sasaki,female`;
const maleJapanFirstNames = parseCsvToFirstNames(japanCsv, 'male');
const femaleJapanFirstNames = parseCsvToFirstNames(japanCsv, 'female');
const japanSurnamesNew = parseCsvToSurnames(japanCsv); // Renamed to avoid conflict

const chinaCsv = `First Name,Surname,Gender
Wei,Wang,male
Fang,Li,female
Lei,Zhang,male
Jing,Liu,female
Tao,Chen,male
Yan,Yang,female
Jian,Huang,male
Min,Zhao,female
Qiang,Wu,male
Hong,Zhou,female
Bo,Xu,male
Juan,Sun,female
Hao,Ma,male
Xia,Hu,female
Peng,Guo,male
Ying,Gao,female
Gang,Lin,male
Li,He,female
Jun,Zheng,male
Qian,Xu,female
Bin,Deng,male
Mei,Zhu,female
Chao,Xie,male
Wei,Song,female
Dong,Tang,male
Yan,Pan,female
Guoqiang,Cao,male
Jing,Feng,female
Ming,Jiang,male
Hong,Peng,female
Zhiqiang,Cai,male
Li,Yuan,female
Jianjun,Xiao,male
Qian,Han,female
Tao,Dong,male
Yan,Cheng,female
Qiang,Shen,male
Min,Wei,female
Bo,Lu,male
Hong,Fang,female
Hao,Cui,male
Xia,Du,female
Peng,Kang,male
Ying,Fu,female
Gang,Zeng,male
Li,Guo,female
Jun,He,male
Qian,Luo,female
Bin,Ma,male
Mei,Sun,female`;
const maleChinaFirstNames = parseCsvToFirstNames(chinaCsv, 'male');
const femaleChinaFirstNames = parseCsvToFirstNames(chinaCsv, 'female');
const chinaSurnamesNew = parseCsvToSurnames(chinaCsv); // Renamed to avoid conflict

const swedenCsv = `First Name,Surname,Gender
William,Andersson,male
Alice,Johansson,female
Liam,Karlsson,male
Maja,Nilsson,female
Noah,Eriksson,male
Elsa,Larsson,female
Lucas,Olsson,male
Ebba,Gustafsson,female
Oscar,Svensson,male
Wilma,Pettersson,female
Hugo,Jonsson,male
Alma,Persson,female
Axel,Bengtsson,male
Freja,Söderberg,female
Elias,Jansson,male
Lilly,Holm,female
Leo,Lindberg,male
Nellie,Lindgren,female
Alfred,Magnusson,male
Vera,Berg,female
Arvid,Lindström,male
Signe,Lundberg,female
Charlie,Olofsson,male
Tilde,Hedlund,female
Valter,Axelsson,male
Molly,Ström,female
Melvin,Bergström,male
Nova,Engström,female
Viggo,Hansen,male
Stella,Dahlberg,female
Filip,Lundqvist,male
Saga,Ekström,female
Gustav,Samuelsson,male
Astrid,Björk,female
Hjalmar,Danielsson,male
Juni,Nyström,female
Sixten,Isaksson,male
Hedda,Sandberg,female
Albin,Viklund,male
Tyra,Sjöberg,female
Edvin,Mattsson,male
Lykke,Wallin,female
Otto,Nordin,male
Majken,Lundin,female
Love,Svensson,male
Alice,Andersson,female
William,Johansson,male
Maja,Karlsson,female
Liam,Nilsson,male
Elsa,Eriksson,female`;
const maleSwedenFirstNames = parseCsvToFirstNames(swedenCsv, 'male');
const femaleSwedenFirstNames = parseCsvToFirstNames(swedenCsv, 'female');
const swedenSurnames = parseCsvToSurnames(swedenCsv);

const spainCsv = `First Name,Surname,Gender
Hugo,García,male
Lucía,Rodríguez,female
Martín,Fernández,male
Sofía,González,female
Lucas,López,male
María,Martínez,female
Leo,Sánchez,male
Valeria,Pérez,female
Daniel,Gómez,male
Paula,Martín,female
Alejandro,Jiménez,male
Daniela,Hernández,female
Pablo,Ruiz,male
Carla,Díaz,female
Álvaro,Moreno,male
Alba,Torres,female
Manuel,Navarro,male
Julia,Ruiz,female
Mateo,Gil,male
Noa,Flores,female
Adrián,Romero,male
Sara,Blanco,female
Diego,Suárez,male
Martina,Serrano,female
Javier,Molina,male
Irene,Prieto,female
Marco,Ortega,male
Laura,Castro,female
Miguel,Delgado,male
Elena,Rubio,female
Gonzalo,Ramírez,male
Claudia,Morales,female
Carlos,Ortiz,male
Andrea,Gallego,female
Juan,Marín,male
Emma,Vázquez,female
David,Iglesias,male
Aitana,Sanz,female
Sergio,Castillo,male
Sofía,García,female
Hugo,Rodríguez,male
Lucía,Fernández,female
Martín,González,male
Sofía,López,female
Lucas,Martínez,male
María,Sánchez,female
Leo,Pérez,male
Valeria,Gómez,female
Daniel,Martín,male
Paula,Jiménez,female`;
const maleSpainFirstNames = parseCsvToFirstNames(spainCsv, 'male');
const femaleSpainFirstNames = parseCsvToFirstNames(spainCsv, 'female');
const spainSurnames = parseCsvToSurnames(spainCsv);

const sloveniaCsv = `First Name,Surname,Gender
Luka,Novak,male
Eva,Horvat,female
Filip,Kovačič,male
Ema,Krajnc,female
Nik,Zupančič,male
Neža,Potočnik,female
Mark,Kovač,male
Zala,Mlakar,female
Jan,Vidmar,male
Ana,Kos,female
Žiga,Gorenc,male
Tia,Kolar,female
Miha,Erjavec,male
Sara,Zupan,female
Matic,Dolenc,male
Nika,Košir,female
Jaka,Jerman,male
Lana,Kralj,female
Urban,Petek,male
Mija,Bizjak,female
Gašper,Hribar,male
Ajda,Lah,female
Aljaž,Kastelic,male
Gaja,Majcen,female
Tilen,Kranjc,male
Zoja,Korošec,female
Klemen,Knez,male
Julija,Križaj,female
Matej,Oblak,male
Vita,Perko,female
David,Pirc,male
Ela,Furlan,female
Tim,Šuštar,male
Lina,Jereb,female
Bor,Koren,male
Brina,Kavčič,female
Maj,Kumer,male
Tisa,Logar,female
Oskar,Marolt,male
Ula,Mlinar,female
Patrik,Pavlič,male
Iza,Pintar,female
Žan,Primožič,male
Kaja,Ramšak,female
Anej,Rupnik,male
Tinkara,Sitar,female
Nace,Svetina,male
Zarja,Šmid,female
Tine,Tomažič,male
Pia,Tratnik,female`;
const maleSloveniaFirstNames = parseCsvToFirstNames(sloveniaCsv, 'male');
const femaleSloveniaFirstNames = parseCsvToFirstNames(sloveniaCsv, 'female');
const sloveniaSurnames = parseCsvToSurnames(sloveniaCsv);

const slovakiaCsv = `First Name,Surname,Gender
Jakub,Horváth,male
Sofia,Kováčová,female
Adam,Kováč,male
Ema,Nagyová,female
Samuel,Tóth,male
Nina,Balážová,female
Michal,Molnár,male
Viktória,Novotná,female
Tomáš,Lukáč,male
Natália,Krajčíová,female
Filip,Novák,male
Laura,Kráľová,female
Matej,Ďurica,male
Alexandra,Kollárová,female
Patrik,Kmeť,male
Zuzana,Šimková,female
Martin,Sloboda,male
Kristína,Hudecová,female
Oliver,Varga,male
Tereza,Urbanová,female
Dávid,Kováčik,male
Barbora,Hrušková,female
Peter,Kováč,male
Dominika,Vargová,female
Daniel,Molnár,male
Lucia,Horváthová,female
Ján,Tóth,male
Michaela,Balážová,female
Marek,Lukáč,male
Simona,Novotná,female
Šimon,Novák,male
Katarína,Kráľová,female
Lukáš,Ďurica,male
Veronika,Kollárová,female
Matúš,Kmeť,male
Lenka,Šimková,female
Erik,Sloboda,male
Nikola,Hudecová,female
Alex,Varga,male
Adela,Urbanová,female
Tobias,Kováčik,male
Emma,Hrušková,female
Adam,Kováč,male
Sofia,Nagyová,female
Jakub,Tóth,male
Ema,Balážová,female
Samuel,Molnár,male
Nina,Novotná,female
Michal,Lukáč,male
Viktória,Krajčíová,female`;
const maleSlovakiaFirstNames = parseCsvToFirstNames(slovakiaCsv, 'male');
const femaleSlovakiaFirstNames = parseCsvToFirstNames(slovakiaCsv, 'female');
const slovakiaSurnames = parseCsvToSurnames(slovakiaCsv);

const romaniaCsv = `First Name,Surname,Gender
Andrei,Popa,male
Maria,Popescu,female
David,Ionescu,male
Elena,Popa,female
Luca,Dumitrescu,male
Ioana,Stan,female
Matei,Georgescu,male
Andreea,Stoica,female
Gabriel,Popescu,male
Alexandra,Radu,female
Stefan,Constantinescu,male
Denisa,Gheorghe,female
Alexandru,Dinu,male
Ana,Mihai,female
Mihai,Florea,male
Bianca,Tudor,female
Robert,Pop,male
Cristina,Preda,female
Denis,Stanciu,male
Gabriela,Vasilescu,female
Vlad,Munteanu,male
Diana,Marin,female
Rareș,Ciobanu,male
Laura,Dobre,female
Tudor,Popovici,male
Monica,Ene,female
Bogdan,Radu,male
Adina,Diaconu,female
Dragoș,Gheorghe,male
Alina,Dumitru,female
Cătălin,Mihai,male
Daniela,Constantin,female
Octavian,Preda,male
Roxana,Popescu,female
Sebastian,Vasilescu,male
Simona,Ionescu,female
Victor,Marin,male
Teodora,Dumitrescu,female
Filip,Dobre,male
Valentina,Georgescu,female
George,Popa,male
Maria,Ionescu,female
Andrei,Popescu,male
Elena,Dumitrescu,female
David,Stan,male
Ioana,Georgescu,female
Luca,Stoica,male
Andreea,Popescu,female
Matei,Radu,male
Alexandra,Constantinescu,female`;
const maleRomaniaFirstNames = parseCsvToFirstNames(romaniaCsv, 'male');
const femaleRomaniaFirstNames = parseCsvToFirstNames(romaniaCsv, 'female');
const romaniaSurnames = parseCsvToSurnames(romaniaCsv);

const portugalCsv = `First Name,Surname,Gender
João,Silva,male
Maria,Santos,female
Francisco,Ferreira,male
Ana,Pereira,female
Diogo,Oliveira,male
Beatriz,Rodrigues,female
Tomás,Martins,male
Leonor,Fernandes,female
Guilherme,Carvalho,male
Matilde,Gomes,female
Gabriel,Ribeiro,male
Carolina,Sousa,female
Miguel,Alves,male
Sofia,Ramos,female
Pedro,Reis,male
Inês,Cruz,female
Gonçalo,Correia,male
Mariana,Dias,female
Rafael,Nunes,male
Clara,Lopes,female
Duarte,Mendes,male
Benedita,Costa,female
Lourenço,Vieira,male
Madalena,Pinto,female
Santiago,Sousa,male
Francisca,Teixeira,female
Afonso,Monteiro,male
Margarida,Moreira,female
Martim,Freitas,male
Laura,Marques,female
Salvador,Castro,male
Luísa,Neves,female
Vicente,Rocha,male
Rita,Fernandes,female
Vasco,Silva,male
Maria,Santos,female
João,Ferreira,male
Ana,Pereira,female
Francisco,Oliveira,male
Beatriz,Rodrigues,female
Diogo,Martins,male
Leonor,Fernandes,female
Tomás,Carvalho,male
Matilde,Gomes,female
Guilherme,Ribeiro,male
Carolina,Sousa,female
Gabriel,Alves,male
Sofia,Ramos,female
Miguel,Reis,male
Inês,Cruz,female`;
const malePortugalFirstNames = parseCsvToFirstNames(portugalCsv, 'male');
const femalePortugalFirstNames = parseCsvToFirstNames(portugalCsv, 'female');
const portugalSurnames = parseCsvToSurnames(portugalCsv);

const polandCsv = `First Name,Surname,Gender
Jan,Kowalski,male
Zofia,Nowak,female
Jakub,Wiśniewski,male
Julia,Kowalczyk,female
Antoni,Wójcik,male
Maja,Lewandowska,female
Szymon,Kowalczyk,male
Hanna,Wójcik,female
Franciszek,Kamiński,male
Lena,Zielińska,female
Filip,Dąbrowski,male
Maria,Woźniak,female
Aleksander,Kozłowski,male
Alicja,Jankowska,female
Mikołaj,Mazur,male
Oliwia,Kaczmarek,female
Wojciech,Krawczyk,male
Laura,Piotrowska,female
Adam,Piotrowski,male
Natalia,Grabowska,female
Marcel,Nowak,male
Pola,Pawlak,female
Leon,Michalski,male
Emilia,Szymczak,female
Ignacy,Wojciechowski,male
Liliana,Dudek,female
Stanisław,Kowalski,male
Gabriela,Nowak,female
Kacper,Wiśniewski,male
Milena,Kowalczyk,female
Oliwier,Wójcik,male
Nadia,Lewandowska,female
Tymon,Kowalczyk,male
Iga,Wójcik,female
Julian,Kamiński,male
Blanka,Zielińska,female
Krzysztof,Dąbrowski,male
Wiktoria,Woźniak,female
Piotr,Kozłowski,male
Martyna,Jankowska,female
Michał,Mazur,male
Amelia,Kaczmarek,female
Paweł,Krawczyk,male
Zuzanna,Piotrowska,female
Bartosz,Piotrowski,male
Kinga,Grabowska,female
Dawid,Nowak,male
Weronika,Pawlak,female
Kamil,Michalski,male
Anna,Szymczak,female`;
const malePolandFirstNames = parseCsvToFirstNames(polandCsv, 'male');
const femalePolandFirstNames = parseCsvToFirstNames(polandCsv, 'female');
const polandSurnames = parseCsvToSurnames(polandCsv);

const netherlandsCsv = `First Name,Surname,Gender
Noah,De Jong,male
Emma,De Vries,female
Liam,Jansen,male
Mila,Van den Berg,female
Lucas,Bakker,male
Sophie,Van Dijk,female
Finn,Visser,male
Julia,Smit,female
Sem,Meijer,male
Tess,De Boer,female
Daan,De Wit,male
Lynn,De Groot,female
Luuk,Müller,male
Fleur,Hendriks,female
Mees,Van Leeuwen,male
Lotte,Dekker,female
Milan,Brouwer,male
Roos,De Ruiter,female
Thijs,Schipper,male
Sara,Jacobs,female
Jesse,Van der Meer,male
Noor,Van der Velden,female
Levi,Van der Linden,male
Elin,Van der Wal,female
Noud,Kok,male
Femke,De Graaf,female
Julian,Jacobs,male
Lieke,Van der Horst,female
Floris,Bos,male
Isa,Peters,female
Ruben,Van Vliet,male
Sanne,Van Loon,female
Thomas,Van der Pol,male
Lisa,Van der Ven,female
Wout,Kramer,male
Evi,Van der Laan,female
Gijs,Van der Heijden,male
Floor,Van der Veen,female
Jens,De Boer,male
Tess,De Jong,female
Noah,De Vries,male
Emma,Jansen,female
Liam,Van den Berg,male
Mila,Bakker,female
Lucas,Van Dijk,male
Sophie,Visser,female
Finn,Smit,male
Julia,Meijer,female
Sem,De Boer,male
Lynn,De Wit,female`;
const maleNetherlandsFirstNames = parseCsvToFirstNames(netherlandsCsv, 'male');
const femaleNetherlandsFirstNames = parseCsvToFirstNames(netherlandsCsv, 'female');
const netherlandsSurnames = parseCsvToSurnames(netherlandsCsv);

const lithuaniaCsv = `First Name,Surname,Gender
Lukas,Kazlauskas,male
Emilija,Petrauskienė,female
Matas,Jankauskas,male
Gabija,Stankevičienė,female
Nojus,Petrauskas,male
Kamilė,Vasiliauskienė,female
Dominykas,Stankevičius,male
Urtė,Žukauskienė,female
Jokūbas,Vasiliauskas,male
Austėja,Butkienė,female
Benas,Žukauskas,male
Liepa,Urbonienė,female
Kajus,Butkus,male
Eglė,Kavaliauskienė,female
Adas,Urbonas,male
Viltė,Baranauskienė,female
Dovydas,Kavaliauskas,male
Smiltė,Navickienė,female
Gustas,Baranauskas,male
Goda,Ramanauskienė,female
Titas,Navickas,male
Meda,Savickienė,female
Herkus,Ramanauskas,male
Luknė,Petrauskaitė,female
Ąžuolas,Savickas,male
Gintarė,Jankauskaitė,female
Joris,Balčiūnas,male
Miglė,Stankevičiūtė,female
Kristupas,Vaitkus,male
Ieva,Vasiliauskaitė,female
Rapolas,Šimkus,male
Kornelija,Žukauskaitė,female
Arnas,Urbanas,male
Gabija,Butkutė,female
Ignas,Vaičiulis,male
Ugnė,Urbonaitė,female
Rokas,Vaitiekūnas,male
Kamilė,Kavaliauskaitė,female
Tautvydas,Petrauskas,male
Austėja,Baranauskaitė,female
Vilius,Jankauskas,male
Liepa,Navickaitė,female
Domas,Stankevičius,male
Eglė,Ramanauskaitė,female
Jonas,Vasiliauskas,male
Viltė,Savickaitė,female
Antanas,Žukauskas,male
Smiltė,Balčiūnaitė,female
Petras,Butkus,male
Goda,Vaitkutė,female`;
const maleLithuaniaFirstNames = parseCsvToFirstNames(lithuaniaCsv, 'male');
const femaleLithuaniaFirstNames = parseCsvToFirstNames(lithuaniaCsv, 'female');
const lithuaniaSurnames = parseCsvToSurnames(lithuaniaCsv);

const latviaCsv = `First Name,Surname,Gender
Roberts,Bērziņš,male
Emīlija,Ozoliņa,female
Gustavs,Kalniņš,male
Alise,Liepiņa,female
Kārlis,Jansons,male
Elza,Krūmiņa,female
Artūrs,Ozols,male
Anna,Vītola,female
Markuss,Liepiņš,male
Paula,Bērziņa,female
Oskars,Krūmiņš,male
Marta,Kalniņa,female
Jēkabs,Jansone,male
Līva,Ozola,female
Daniels,Vītols,male
Katrīna,Liepiņa,female
Edvards,Bērziņš,male
Laura,Ozoliņa,female
Ričards,Kalniņš,male
Grieta,Liepiņa,female
Kristaps,Jansons,male
Estere,Krūmiņa,female
Ralfs,Ozols,male
Sofija,Vītola,female
Valters,Liepiņš,male
Ance,Bērziņa,female
Adrians,Krūmiņš,male
Beāte,Kalniņa,female
Ernests,Jansone,male
Dārta,Ozola,female
Rūdolfs,Vītols,male
Elīza,Liepiņa,female
Toms,Bērziņš,male
Kate,Ozoliņa,female
Miks,Kalniņš,male
Maija,Liepiņa,female
Krišjānis,Jansons,male
Laima,Krūmiņa,female
Dāvis,Ozols,male
Zane,Vītola,female
Jānis,Bērziņš,male
Emīlija,Ozoliņa,female
Roberts,Kalniņš,male
Alise,Liepiņa,female
Gustavs,Jansons,male
Elza,Krūmiņa,female
Kārlis,Ozols,male
Anna,Vītola,female
Artūrs,Liepiņš,male
Paula,Bērziņa,female`;
const maleLatviaFirstNames = parseCsvToFirstNames(latviaCsv, 'male');
const femaleLatviaFirstNames = parseCsvToFirstNames(latviaCsv, 'female');
const latviaSurnames = parseCsvToSurnames(latviaCsv);

const italyCsv = `First Name,Surname,Gender
Leonardo,Rossi,male
Sofia,Ferrari,female
Francesco,Russo,male
Giulia,Bianchi,female
Alessandro,Romano,male
Martina,Ricci,female
Lorenzo,Esposito,male
Alice,Marino,female
Mattia,Bruno,male
Aurora,Gallo,female
Andrea,Conti,male
Anna,Greco,female
Gabriele,De Luca,male
Chiara,Mancini,female
Riccardo,Costa,male
Giorgia,Moretti,female
Tommaso,Giordano,male
Vittoria,Barbieri,female
Federico,Rizzo,male
Emma,Fontana,female
Niccolò,Serra,male
Beatrice,Santoro,female
Antonio,De Angelis,male
Ginevra,Rinaldi,female
Giuseppe,Colombo,male
Elena,Caruso,female
Christian,Mancini,male
Camilla,Galli,female
Samuele,Ricci,male
Noemi,Conte,female
Filippo,Marino,male
Sara,Ferrara,female
Edoardo,Bruno,male
Gaia,Rizzo,female
Diego,Gallo,male
Ludovica,Lombardi,female
Pietro,Conti,male
Matilde,Mariani,female
Davide,De Luca,male
Sofia,Rossi,female
Leonardo,Ferrari,male
Giulia,Russo,female
Francesco,Bianchi,male
Martina,Romano,female
Alessandro,Ricci,male
Alice,Esposito,female
Lorenzo,Marino,male
Aurora,Bruno,female
Mattia,Gallo,male
Anna,Conti,female`;
const maleItalyFirstNames = parseCsvToFirstNames(italyCsv, 'male');
const femaleItalyFirstNames = parseCsvToFirstNames(italyCsv, 'female');
const italySurnames = parseCsvToSurnames(italyCsv);

const irelandCsv = `First Name,Surname,Gender
Jack,Murphy,male
Emily,Kelly,female
Noah,Byrne,male
Grace,Ryan,female
James,Walsh,male
Sophie,O'Connor,female
Daniel,O'Brien,male
Ava,Doyle,female
Conor,Lynch,male
Ella,McCarthy,female
Finn,Reilly,male
Amelia,Gallagher,female
Liam,Daly,male
Hannah,Moore,female
Harry,Kennedy,male
Chloe,Burke,female
Charlie,Collins,male
Lucy,Quinn,female
Michael,Clarke,male
Aoife,Hughes,female
Adam,Duffy,male
Caoimhe,Fitzgerald,female
Cillian,Hurley,male
Saoirse,Browne,female
Fionn,Barry,male
Clodagh,Power,female
Patrick,Sweeney,male
Niamh,Hayes,female
Sean,Doyle,male
Orla,MacDonald,female
Oisin,White,male
Ciara,Daly,female
Ronan,Dunne,male
Roisin,Brennan,female
Thomas,Farrell,male
Eimear,Byrne,female
Oscar,Fitzgerald,male
Holly,Murphy,female
Leo,Kelly,male
Grace,Ryan,female
Jack,Walsh,male
Emily,O'Connor,female
Noah,O'Brien,male
Sophie,Doyle,female
James,Lynch,male
Ava,McCarthy,female
Daniel,Reilly,male
Ella,Gallagher,female
Conor,Daly,male
Amelia,Moore,female`;
const maleIrelandFirstNames = parseCsvToFirstNames(irelandCsv, 'male');
const femaleIrelandFirstNames = parseCsvToFirstNames(irelandCsv, 'female');
const irelandSurnames = parseCsvToSurnames(irelandCsv);

const hungaryCsv = `First Name,Surname,Gender
Bence,Nagy,male
Hanna,Kovács,female
Máté,Tóth,male
Anna,Szabó,female
Levente,Horváth,male
Luca,Kiss,female
Dominik,Varga,male
Zsófia,Molnár,female
Noel,Takács,male
Lili,Németh,female
Dávid,Kovács,male
Emma,Farkas,female
Zsombor,Balogh,male
Adél,Papp,female
Ádám,Kiss,male
Laura,Juhász,female
Gergő,Szabó,male
Flóra,Mészáros,female
Olivér,Molnár,male
Mira,Oláh,female
Botond,Tóth,male
Réka,Simon,female
Krisztián,Horváth,male
Gréta,Kovács,female
Márk,Varga,male
Nóra,Nagy,female
Tamás,Takács,male
Panna,Tóth,female
Balázs,Németh,male
Dóra,Horváth,female
Benedek,Farkas,male
Zselyke,Balogh,female
Milán,Papp,male
Fanni,Juhász,female
Zalán,Mészáros,male
Léna,Oláh,female
Áron,Simon,male
Boglárka,Kovács,female
Patrik,Varga,male
Hanna,Nagy,female
Bence,Kovács,male
Anna,Szabó,female
Máté,Horváth,male
Luca,Kiss,female
Levente,Varga,male
Zsófia,Molnár,female
Dominik,Takács,male
Lili,Németh,female
Noel,Kovács,male
Emma,Farkas,female`;
const maleHungaryFirstNames = parseCsvToFirstNames(hungaryCsv, 'male');
const femaleHungaryFirstNames = parseCsvToFirstNames(hungaryCsv, 'female');
const hungarySurnames = parseCsvToSurnames(hungaryCsv);

const greeceCsv = `First Name,Surname,Gender
Giorgos,Papadopoulos,male
Maria,Papadopoulou,female
Konstantinos,Vasileiou,male
Eleni,Georgiou,female
Dimitris,Nikolaou,male
Sofia,Karagianni,female
Nikolaos,Georgiou,male
Aikaterini,Panagiotopoulou,female
Ioannis,Karagiannis,male
Vasiliki,Konstantinidou,female
Christos,Panagiotopoulos,male
Despoina,Athanasiou,female
Panagiotis,Konstantinidis,male
Georgia,Papadopoulou,female
Alexandros,Athanasiou,male
Chrysa,Vasileiou,female
Vasilis,Papadopoulos,male
Maria,Georgiou,female
Konstantinos,Nikolaou,male
Eleni,Karagianni,female
Dimitris,Georgiou,male
Sofia,Panagiotopoulou,female
Nikolaos,Karagiannis,male
Aikaterini,Konstantinidou,female
Ioannis,Panagiotopoulos,male
Vasiliki,Athanasiou,female
Christos,Konstantinidis,male
Despoina,Papadopoulou,female
Panagiotis,Vasileiou,male
Georgia,Georgiou,female
Alexandros,Nikolaou,male
Chrysa,Karagianni,female
Vasilis,Georgiou,male
Maria,Panagiotopoulou,female
Konstantinos,Karagiannis,male
Eleni,Konstantinidou,female
Dimitris,Panagiotopoulos,male
Sofia,Athanasiou,female
Nikolaos,Papadopoulos,male
Aikaterini,Vasileiou,female
Ioannis,Georgiou,male
Vasiliki,Nikolaou,female
Christos,Karagianni,male
Despoina,Panagiotopoulou,female
Panagiotis,Konstantinidis,male
Georgia,Athanasiou,female
Alexandros,Papadopoulos,male
Chrysa,Vasileiou,female
Vasilis,Georgiou,male
Maria,Nikolaou,female`;
const maleGreeceFirstNames = parseCsvToFirstNames(greeceCsv, 'male');
const femaleGreeceFirstNames = parseCsvToFirstNames(greeceCsv, 'female');
const greeceSurnames = parseCsvToSurnames(greeceCsv);

const germanyCsv = `First Name,Surname,Gender
Noah,Müller,male
Emilia,Schmidt,female
Leon,Schneider,male
Hannah,Fischer,female
Paul,Weber,male
Mia,Meyer,female
Ben,Wagner,male
Sophia,Schulz,female
Jonas,Becker,male
Emma,Hoffmann,female
Louis,Schäfer,male
Lina,Koch,female
Luca,Wolf,male
Clara,Richter,female
Finn,Klein,male
Lena,Bauer,female
Felix,Schröder,male
Marie,Wagner,female
Max,Neumann,male
Amelie,Schulz,female
Henry,Schwarz,male
Charlotte,Hofmann,female
Oskar,Braun,male
Mila,Franke,female
Anton,Maier,male
Luisa,Lehmann,female
Moritz,Meier,male
Ida,Mayer,female
Jakob,Schmidt,male
Sophie,Müller,female
Noah,Schneider,male
Emilia,Fischer,female
Leon,Weber,male
Hannah,Meyer,female
Paul,Wagner,male
Mia,Schulz,female
Ben,Becker,male
Sophia,Hoffmann,female
Jonas,Schäfer,male
Emma,Koch,female
Louis,Wolf,male
Lina,Richter,female
Luca,Klein,male
Clara,Bauer,female
Finn,Schröder,male
Lena,Wagner,female
Felix,Neumann,male
Marie,Schulz,female
Max,Schwarz,male
Amelie,Hofmann,female`;
const maleGermanyFirstNames = parseCsvToFirstNames(germanyCsv, 'male');
const femaleGermanyFirstNames = parseCsvToFirstNames(germanyCsv, 'female');
const germanySurnames = parseCsvToSurnames(germanyCsv);

const franceCsv = `First Name,Surname,Gender
Gabriel,Martin,male
Louise,Bernard,female
Léo,Dubois,male
Jade,Thomas,female
Raphaël,Robert,male
Manon,Petit,female
Arthur,Richard,male
Léa,Durand,female
Louis,Dupont,male
Chloé,Leroy,female
Jules,Moreau,male
Alice,Michel,female
Adam,Laurent,male
Lina,Garcia,female
Maël,David,male
Rose,Bertrand,female
Hugo,Roux,male
Jeanne,Fournier,female
Noah,Legrand,male
Anna,Morel,female
Lucas,Simon,male
Camille,Girard,female
Paul,Vincent,male
Inès,Andre,female
Nathan,Lefebvre,male
Julia,Mercier,female
Gabin,Dupuis,male
Margaux,Bonnet,female
Sacha,Meyer,male
Zoe,Fontaine,female
Tom,Faure,male
Clara,Robin,female
Mohamed,Marchand,male
Lou,Dubois,female
Ethan,Lambert,male
Louise,Martin,female
Gabriel,Bernard,male
Jade,Thomas,female
Léo,Robert,male
Manon,Petit,female
Raphaël,Richard,male
Léa,Durand,female
Arthur,Dupont,male
Chloé,Leroy,female
Louis,Moreau,male
Alice,Michel,female
Jules,Laurent,male
Lina,Garcia,female
Adam,David,male
Rose,Bertrand,female`;
const maleFranceFirstNames = parseCsvToFirstNames(franceCsv, 'male');
const femaleFranceFirstNames = parseCsvToFirstNames(franceCsv, 'female');
const franceSurnames = parseCsvToSurnames(franceCsv);

const finlandCsv = `First Name,Surname,Gender
Leo,Korhonen,male
Aino,Virtanen,female
Elias,Mäkinen,male
Sofia,Nieminen,female
Väinö,Hämäläinen,male
Emilia,Koskinen,female
Onni,Laine,male
Helmi,Järvinen,female
Eetu,Heikkinen,male
Venla,Lehtonen,female
Oliver,Savolainen,male
Ellen,Virtanen,female
Niilo,Korhonen,male
Aada,Mäkinen,female
Matias,Virtanen,male
Pihla,Nieminen,female
Toivo,Hämäläinen,male
Lilja,Koskinen,female
Vilho,Laine,male
Seela,Järvinen,female
Akseli,Heikkinen,male
Linnea,Lehtonen,female
Eino,Savolainen,male
Viola,Virtanen,female
Oiva,Korhonen,male
Saimi,Mäkinen,female
Eliel,Virtanen,male
Kerttu,Nieminen,female
Otso,Hämäläinen,male
Ilona,Koskinen,female
Urho,Laine,male
Aava,Järvinen,female
Viljami,Heikkinen,male
Eevi,Lehtonen,female
Aaro,Savolainen,male
Saga,Virtanen,female
Leo,Korhonen,male
Aino,Virtanen,female
Elias,Mäkinen,male
Sofia,Nieminen,female
Väinö,Hämäläinen,male
Emilia,Koskinen,female
Onni,Laine,male
Helmi,Järvinen,female
Eetu,Heikkinen,male
Venla,Lehtonen,female`;
const maleFinlandFirstNames = parseCsvToFirstNames(finlandCsv, 'male');
const femaleFinlandFirstNames = parseCsvToFirstNames(finlandCsv, 'female');
const finlandSurnames = parseCsvToSurnames(finlandCsv);

const estoniaCsv = `First Name,Surname,Gender
Rasmus,Tamm,male
Mia,Kask,female
Oliver,Mägi,male
Sofia,Kuusk,female
Robin,Sepp,male
Emilia,Rebane,female
Hugo,Kukk,male
Laura,Ilves,female
Markus,Pärn,male
Eliise,Kivi,female
Karl,Saar,male
Liisa,Lepp,female
Martin,Koppel,male
Adeele,Oja,female
Artur,Kivi,male
Lenna,Mets,female
Mattias,Kuusk,male
Loore,Pärn,female
Oskar,Ilves,male
Grete,Saar,female
Kristofer,Lepp,male
Merili,Koppel,female
Henri,Oja,male
Mirtel,Kivi,female
Johannes,Mets,male
Sandra,Kuusk,female
Kaspar,Pärn,male
Lisandra,Ilves,female
Kevin,Saar,male
Laura,Lepp,female
Oliver,Tamm,male
Mia,Kask,female
Rasmus,Mägi,male
Sofia,Kuusk,female
Robin,Sepp,male
Emilia,Rebane,female
Hugo,Kukk,male
Laura,Ilves,female
Markus,Pärn,male
Eliise,Kivi,female
Karl,Saar,male
Liisa,Lepp,female
Martin,Koppel,male
Adeele,Oja,female
Artur,Kivi,male
Lenna,Mets,female
Mattias,Kuusk,male
Loore,Pärn,female
Oskar,Ilves,male
Grete,Saar,female`;
const maleEstoniaFirstNames = parseCsvToFirstNames(estoniaCsv, 'male');
const femaleEstoniaFirstNames = parseCsvToFirstNames(estoniaCsv, 'female');
const estoniaSurnames = parseCsvToSurnames(estoniaCsv);

const denmarkCsv = `First Name,Surname,Gender
William,Jensen,male
Ida,Nielsen,female
Noah,Hansen,male
Clara,Pedersen,female
Oscar,Andersen,male
Ella,Christensen,female
Carl,Larsen,male
Freja,Olsen,female
Malte,Sørensen,male
Alberte,Thomsen,female
Emil,Kristensen,male
Agnes,Poulsen,female
Lucas,Petersen,male
Anna,Møller,female
Oliver,Jørgensen,male
Laura,Schmidt,female
Victor,Madsen,male
Josefine,Andersen,female
Alfred,Eriksen,male
Karla,Rasmussen,female
Valdemar,Christensen,male
Sofia,Larsen,female
August,Olsen,male
Alma,Sørensen,female
Aksel,Thomsen,male
Vigga,Kristensen,female
Magnus,Poulsen,male
Marie,Petersen,female
William,Jensen,male
Ida,Nielsen,female
Noah,Hansen,male
Clara,Pedersen,female
Oscar,Andersen,male
Ella,Christensen,female
Carl,Larsen,male
Freja,Olsen,female
Malte,Sørensen,male
Alberte,Thomsen,female
Emil,Kristensen,male
Agnes,Poulsen,female
Lucas,Petersen,male
Anna,Møller,female
Oliver,Jørgensen,male
Laura,Schmidt,female
Victor,Madsen,male
Josefine,Andersen,female
Alfred,Eriksen,male
Karla,Rasmussen,female`;
const maleDenmarkFirstNames = parseCsvToFirstNames(denmarkCsv, 'male');
const femaleDenmarkFirstNames = parseCsvToFirstNames(denmarkCsv, 'female');
const denmarkSurnames = parseCsvToSurnames(denmarkCsv);

const czechRepublicCsv = `First Name,Surname,Gender
Jakub,Novák,male
Eliška,Nováková,female
Jan,Svoboda,male
Anna,Svobodová,female
Tomáš,Dvořák,male
Adéla,Dvořáková,female
Adam,Černý,male
Tereza,Černá,female
Matyáš,Procházka,male
Karolína,Procházková,female
Filip,Kučera,male
Kristýna,Kučerová,female
Vojtěch,Veselý,male
Kateřina,Veselá,female
Dominik,Horák,male
Lucie,Horáková,female
Lukáš,Němec,male
Barbora,Němcová,female
Ondřej,Marek,male
Veronika,Marková,female
Daniel,Pospíšil,male
Natálie,Pospíšilová,female
David,Jelínek,male
Nikola,Jelínková,female
Šimon,Růžička,male
Denisa,Růžičková,female
Martin,Beneš,male
Michaela,Benešová,female
Jakub,Novák,male
Eliška,Nováková,female
Jan,Svoboda,male
Anna,Svobodová,female
Tomáš,Dvořák,male
Adéla,Dvořáková,female
Adam,Černý,male
Tereza,Černá,female
Matyáš,Procházka,male
Karolína,Procházková,female
Filip,Kučera,male
Kristýna,Kučerová,female
Vojtěch,Veselý,male
Kateřina,Veselá,female
Dominik,Horák,male
Lucie,Horáková,female
Lukáš,Němec,male
Barbora,Němcová,female
Ondřej,Marek,male
Veronika,Marková,female`;
const maleCzechRepublicFirstNames = parseCsvToFirstNames(czechRepublicCsv, 'male');
const femaleCzechRepublicFirstNames = parseCsvToFirstNames(czechRepublicCsv, 'female');
const czechRepublicSurnames = parseCsvToSurnames(czechRepublicCsv);

const cyprusCsv = `First Name,Surname,Gender
Andreas,Georgiou,male
Maria,Ioannou,female
Giorgos,Constantinou,male
Eleni,Nicolaou,female
Constantinos,Hadjigeorgiou,male
Sofia,Papadopoulou,female
Demetris,Christou,male
Antri,Michael,female
Panayiotis,Kyriacou,male
Chrystalla,Charalambous,female
Nikolas,Savva,male
Anna,Andreou,female
Michalis,Stylianou,male
Georgia,Panayiotou,female
Christos,Antoniou,male
Elena,Christodoulou,female
Stelios,Papadopoulos,male
Katerina,Georgiou,female
Andreas,Ioannou,male
Maria,Constantinou,female
Giorgos,Nicolaou,male
Eleni,Hadjigeorgiou,female
Constantinos,Papadopoulou,male
Sofia,Christou,female
Demetris,Michael,male
Antri,Kyriacou,female
Panayiotis,Charalambous,male
Chrystalla,Savva,female
Nikolas,Andreou,male
Anna,Stylianou,female
Michalis,Panayiotou,male
Georgia,Antoniou,female
Christos,Christodoulou,male
Elena,Papadopoulos,female
Stelios,Georgiou,male
Katerina,Ioannou,female
Andreas,Constantinou,male
Maria,Nicolaou,female
Giorgos,Hadjigeorgiou,male
Eleni,Papadopoulou,female
Constantinos,Christou,male
Sofia,Michael,female
Demetris,Kyriacou,male
Antri,Charalambous,female
Panayiotis,Savva,male
Chrystalla,Andreou,female
Nikolas,Stylianou,male
Anna,Panayiotou,female
Michalis,Antoniou,male
Georgia,Christodoulou,female`;
const maleCyprusFirstNames = parseCsvToFirstNames(cyprusCsv, 'male');
const femaleCyprusFirstNames = parseCsvToFirstNames(cyprusCsv, 'female');
const cyprusSurnames = parseCsvToSurnames(cyprusCsv);

const croatiaCsv = `First Name,Surname,Gender
Luka,Horvat,male
Mia,Kovačević,female
Ivan,Perić,male
Ema,Novak,female
David,Jurić,male
Sara,Marić,female
Jakov,Knežević,male
Nika,Petrović,female
Filip,Marković,male
Ana,Kovačić,female
Petar,Babić,male
Lucija,Vuković,female
Matej,Kovač,male
Marta,Jurić,female
Fran,Kralj,male
Dora,Perić,female
Borna,Vuković,male
Iva,Novak,female
Ante,Kovačić,male
Lena,Marić,female
Dominik,Jurić,male
Klara,Petrović,female
Tin,Marković,male
Vita,Kovačić,female
Noa,Babić,male
Franko,Vuković,male
Roko,Kovač,male
Cvita,Jurić,female
Toma,Kralj,male
Maša,Perić,female
Lovro,Vuković,male
Lana,Novak,female
Marin,Kovačić,male
Tara,Marić,female
Luka,Horvat,male
Mia,Kovačević,female
Ivan,Perić,male
Ema,Novak,female
David,Jurić,male
Sara,Marić,female
Jakov,Knežević,male
Nika,Petrović,female
Filip,Marković,male
Ana,Kovačić,female
Petar,Babić,male
Lucija,Vuković,female
Matej,Kovač,male
Marta,Jurić,female
Fran,Kralj,male
Dora,Perić,female`;
const maleCroatiaFirstNames = parseCsvToFirstNames(croatiaCsv, 'male');
const femaleCroatiaFirstNames = parseCsvToFirstNames(croatiaCsv, 'female');
const croatiaSurnames = parseCsvToSurnames(croatiaCsv);

const bulgariaCsv = `First Name,Surname,Gender
Georgi,Ivanov,male
Maria,Georgieva,female
Aleksandar,Petrov,male
Viktoria,Dimitrova,female
Nikola,Georgiev,male
Gabriela,Petrova,female
Dimitar,Dimitrov,male
Elena,Ivanova,female
Ivan,Nikolov,male
Teodora,Nikolova,female
Martin,Hristov,male
Alexandra,Hristova,female
Kaloyan,Stoyanov,male
Yoana,Stoyanova,female
Kristiyan,Vasilev,male
Simona,Vasileva,female
Boris,Todorov,male
Gergana,Todorova,female
Daniel,Popov,male
Desislava,Popova,female
Victor,Angelov,male
Radostina,Angelova,female
Filip,Kostadinov,male
Preslava,Kostadinova,female
Georgi,Ivanov,male
Maria,Georgieva,female
Aleksandar,Petrov,male
Viktoria,Dimitrova,female
Nikola,Georgiev,male
Gabriela,Petrova,female
Dimitar,Dimitrov,male
Elena,Ivanova,female
Ivan,Nikolov,male
Teodora,Nikolova,female
Martin,Hristov,male
Alexandra,Hristova,female
Kaloyan,Stoyanov,male
Yoana,Stoyanova,female
Kristiyan,Vasilev,male
Simona,Vasileva,female
Boris,Todorov,male
Gergana,Todorova,female
Daniel,Popov,male
Desislava,Popova,female
Victor,Angelov,male
Radostina,Angelova,female
Filip,Kostadinov,male
Preslava,Kostadinova,female`;
const maleBulgariaFirstNames = parseCsvToFirstNames(bulgariaCsv, 'male');
const femaleBulgariaFirstNames = parseCsvToFirstNames(bulgariaCsv, 'female');
const bulgariaSurnames = parseCsvToSurnames(bulgariaCsv);

const belgiumCsv = `First Name,Surname,Gender
Arthur,Peeters,male
Olivia,Janssens,female
Louis,Maes,male
Emma,Mertens,female
Noah,Goossens,male
Louise,Smets,female
Jules,Wouters,male
Léa,De Smet,female
Victor,Dubois,male
Camille,Jacobs,female
Liam,Claes,male
Alice,Hermans,female
Lucas,Vermeulen,male
Manon,Van den Broeck,female
Adam,De Clercq,male
Chloé,Van den Bossche,female
Finn,Michiels,male
Marie,Dupont,female
Oscar,Lemaire,male
Elise,Lambert,female
Milan,Devos,male
Juliette,Vandenberghe,female
Bas,Desmet,male
Fleur,Lefevre,female
Mathis,Vandamme,male
Zoé,Marchal,female
Gus,Renard,male
Noémie,Simon,female
Leon,Dumont,male
Margaux,Leroy,female
Arthur,Peeters,male
Olivia,Janssens,female
Louis,Maes,male
Emma,Mertens,female
Noah,Goossens,male
Louise,Smets,female
Jules,Wouters,male
Léa,De Smet,female
Victor,Dubois,male
Camille,Jacobs,female
Liam,Claes,male
Alice,Hermans,female
Lucas,Vermeulen,male
Manon,Van den Broeck,female
Adam,De Clercq,male
Chloé,Van den Bossche,female
Finn,Michiels,male
Marie,Dupont,female
Oscar,Lemaire,male
Elise,Lambert,female`;
const maleBelgiumFirstNames = parseCsvToFirstNames(belgiumCsv, 'male');
const femaleBelgiumFirstNames = parseCsvToFirstNames(belgiumCsv, 'female');
const belgiumSurnames = parseCsvToSurnames(belgiumCsv);


const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const nameData = {
    English: { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    Scottish: { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    Welsh: { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    'Northern Irish': { male: maleBritishFirstNames, female: femaleBritishFirstNames, surnames: britishSurnames },
    American: { male: maleAmericanFirstNames, female: femaleAmericanFirstNames, surnames: americanSurnames },
    Canadian: { male: maleCanadianFirstNames, female: femaleCanadianFirstNames, surnames: canadianSurnames },
    German: { male: maleGermanyFirstNames, female: femaleGermanyFirstNames, surnames: germanySurnames },
    French: { male: maleFranceFirstNames, female: femaleFranceFirstNames, surnames: franceSurnames },
    Czech: { male: maleCzechRepublicFirstNames, female: femaleCzechRepublicFirstNames, surnames: czechRepublicSurnames },
    Slovak: { male: maleSlovakiaFirstNames, female: femaleSlovakiaFirstNames, surnames: slovakiaSurnames },
    Swedish: { male: maleSwedenFirstNames, female: femaleSwedenFirstNames, surnames: swedenSurnames },
    Finnish: { male: maleFinlandFirstNames, female: femaleFinlandFirstNames, surnames: finlandSurnames },
    Latvian: { male: maleLatviaFirstNames, female: femaleLatviaFirstNames, surnames: latviaSurnames },
    Swiss: { male: maleEuropeanFirstNames, female: femaleEuropeanFirstNames, surnames: europeanSurnames }, // No specific Swiss data provided, keeping generic European
    Chinese: { male: maleChinaFirstNames, female: femaleChinaFirstNames, surnames: chinaSurnamesNew },
    Japanese: { male: maleJapanFirstNames, female: femaleJapanFirstNames, surnames: japanSurnamesNew },
    Korean: { male: maleAsianFirstNames, female: femaleAsianFirstNames, surnames: koreanSurnames }, // No specific Korean data provided, keeping generic Asian
    Indian: { male: maleIndianFirstNames, female: femaleIndianFirstNames, surnames: indianSurnamesNew },
    Vietnamese: { male: maleVietnamFirstNames, female: femaleVietnamFirstNames, surnames: vietnamSurnamesNew },
    Nigerian: { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    Ghanaian: { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    Kenyan: { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    'South African': { male: maleAfricanFirstNames, female: femaleAfricanFirstNames, surnames: africanSurnames },
    Mexican: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
    Brazilian: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
    Argentinian: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
    Colombian: { male: maleLatinAmericanFirstNames, female: femaleLatinAmericanFirstNames, surnames: latinAmericanSurnames },
    // Newly added nationalities
    Austrian: { male: maleAustrianFirstNames, female: femaleAustrianFirstNames, surnames: austrianSurnames },
    Russian: { male: maleRussianFirstNames, female: femaleRussianFirstNames, surnames: russianSurnames },
    Taiwanese: { male: maleTaiwanFirstNames, female: femaleTaiwanFirstNames, surnames: taiwanSurnames },
    'New Zealander': { male: maleNewZealandFirstNames, female: femaleNewZealandFirstNames, surnames: newZealandSurnames },
    Australian: { male: maleAustraliaFirstNames, female: femaleAustraliaFirstNames, surnames: australiaSurnames },
    'Hong Konger': { male: maleHongKongFirstNames, female: femaleHongKongFirstNames, surnames: hongKongSurnames },
    Spanish: { male: maleSpainFirstNames, female: femaleSpainFirstNames, surnames: spainSurnames },
    Slovenian: { male: maleSloveniaFirstNames, female: femaleSloveniaFirstNames, surnames: sloveniaSurnames },
    Romanian: { male: maleRomaniaFirstNames, female: femaleRomaniaFirstNames, surnames: romaniaSurnames },
    Portuguese: { male: malePortugalFirstNames, female: femalePortugalFirstNames, surnames: portugalSurnames },
    Polish: { male: malePolandFirstNames, female: femalePolandFirstNames, surnames: polandSurnames },
    Dutch: { male: maleNetherlandsFirstNames, female: femaleNetherlandsFirstNames, surnames: netherlandsSurnames },
    Lithuanian: { male: maleLithuaniaFirstNames, female: femaleLithuaniaFirstNames, surnames: lithuaniaSurnames },
    Italian: { male: maleItalyFirstNames, female: femaleItalyFirstNames, surnames: italySurnames },
    Irish: { male: maleIrelandFirstNames, female: femaleIrelandFirstNames, surnames: irelandSurnames },
    Hungarian: { male: maleHungaryFirstNames, female: femaleHungaryFirstNames, surnames: hungarySurnames },
    Greek: { male: maleGreeceFirstNames, female: femaleGreeceFirstNames, surnames: greeceSurnames },
    Estonian: { male: maleEstoniaFirstNames, female: femaleEstoniaFirstNames, surnames: estoniaSurnames },
    Danish: { male: maleDenmarkFirstNames, female: femaleDenmarkFirstNames, surnames: denmarkSurnames },
    Cypriot: { male: maleCyprusFirstNames, female: femaleCyprusFirstNames, surnames: cyprusSurnames },
    Croatian: { male: maleCroatiaFirstNames, female: femaleCroatiaFirstNames, surnames: croatiaSurnames },
    Bulgarian: { male: maleBulgariaFirstNames, female: femaleBulgariaFirstNames, surnames: bulgariaSurnames },
    Belgian: { male: maleBelgiumFirstNames, female: femaleBelgiumFirstNames, surnames: belgiumSurnames },
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