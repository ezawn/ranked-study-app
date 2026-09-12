/**
 * Computer science generators written to close subtopic gaps.
 *
 * Same purpose as the maths `coverage.ts`: the topic tree promises a filter for
 * every subtopic, so every subtopic needs questions behind it. These runs are
 * shorter than the core generators because breadth is the point — a handful of
 * solid recall questions per subtopic rather than twenty.
 *
 * Each question carries its own four wrong answers, every one a real
 * alternative from the same corner of the specification, so the question tests
 * understanding rather than reading.
 */

import { generator, pickDistractors, Rng, type Generator } from "./kit";

const GCSE = "YEAR_10" as const;
const GCSE_LATE = "YEAR_11" as const;

interface Case {
  q: string;
  a: string;
  wrong: readonly [string, string, string, string];
  why: string;
}

/** Build a short recall generator from a list of self-contained cases. */
function recall(opts: {
  key: string;
  topic: string;
  subtopic: string;
  level?: typeof GCSE | typeof GCSE_LATE;
  difficulty?: number;
  cases: readonly Case[];
}): Generator {
  return generator({
    key: opts.key,
    subject: "computer-science",
    topic: opts.topic,
    subtopic: opts.subtopic,
    curriculumLevel: opts.level ?? GCSE_LATE,
    difficulty: opts.difficulty ?? 3,
    variants: opts.cases.length,
    build: (rng: Rng) => {
      const c = opts.cases[rng.int(0, opts.cases.length - 1)];
      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  });
}

export const csCoverage: Generator[] = [
  /* -------------------------------------------------- Systems architecture */

  recall({
    key: "cs.cover.von-neumann",
    topic: "cs-architecture",
    subtopic: "von-neumann",
    cases: [
      {
        q: "Which statement describes the von Neumann architecture?",
        a: "Instructions and data share one memory and one bus to the processor",
        wrong: [
          "Instructions and data use two physically separate memories",
          "Instructions are stored in the CPU registers and data in RAM",
          "Programs are fixed in the hardware and cannot be changed",
          "There is no need for a program counter",
        ],
        why: "Because instructions and data share a single path to the CPU, only one can be fetched at a time — the 'von Neumann bottleneck'.",
      },
      {
        q: "What is the 'stored program concept' at the heart of the von Neumann architecture?",
        a: "A program's instructions are held in main memory alongside its data",
        wrong: [
          "A program is wired into the machine before it can run",
          "A program runs only from read-only memory",
          "Instructions are entered one at a time from switches",
          "The program is stored on paper tape and read continuously",
        ],
        why: "Before this idea machines were rewired for each task; storing the program in memory lets one machine run any program.",
      },
      {
        q: "How does a Harvard architecture differ from a von Neumann architecture?",
        a: "It uses separate memories and buses for instructions and data",
        wrong: [
          "It has no arithmetic logic unit",
          "It cannot execute more than one program in a session",
          "It stores the program on secondary storage during execution",
          "It replaces the CPU with dedicated logic gates",
        ],
        why: "Separate paths let an instruction and its data be fetched at the same time, which is why some embedded processors use it.",
      },
    ],
  }),

  recall({
    key: "cs.cover.embedded",
    topic: "cs-architecture",
    subtopic: "embedded-systems",
    level: GCSE,
    difficulty: 2,
    cases: [
      {
        q: "Which of these is an embedded system?",
        a: "The controller inside a microwave oven",
        wrong: [
          "A desktop computer running several applications",
          "A cloud server hosting websites",
          "A laptop used for schoolwork",
          "A smartphone that installs apps from a store",
        ],
        why: "An embedded system is a computer built into a device to do one dedicated job, unlike a general-purpose PC.",
      },
      {
        q: "Why can an embedded system often use a slower processor and less memory than a laptop?",
        a: "It runs one fixed program rather than any software the user installs",
        wrong: [
          "It never has to store any data at all",
          "It always runs in the cloud rather than locally",
          "It uses a faster type of RAM than a laptop",
          "It has no processor, only sensors",
        ],
        why: "A dedicated task has predictable, limited requirements, so the hardware can be smaller, cheaper and more power-efficient.",
      },
      {
        q: "Which is typically NOT a feature of an embedded system?",
        a: "A general-purpose operating system that runs third-party applications",
        wrong: [
          "Low power consumption",
          "A dedicated function within a larger device",
          "Small physical size",
          "Firmware stored in ROM or flash memory",
        ],
        why: "Embedded systems usually run dedicated firmware; they rarely let a user install arbitrary programs.",
      },
    ],
  }),

  /* -------------------------------------------------- Memory and storage */

  recall({
    key: "cs.cover.virtual-memory",
    topic: "cs-memory",
    subtopic: "virtual-memory",
    cases: [
      {
        q: "What is virtual memory?",
        a: "An area of secondary storage used as an extension of RAM when RAM is full",
        wrong: [
          "A faster type of RAM used only by the operating system",
          "Memory that exists only on a remote server",
          "The part of ROM that holds the boot program",
          "Cache memory built into the CPU",
        ],
        why: "The operating system moves pages that are not currently needed to disk, freeing RAM for active data.",
      },
      {
        q: "Why does heavy use of virtual memory slow a computer down?",
        a: "Secondary storage is far slower to read and write than RAM",
        wrong: [
          "The CPU clock speed is automatically reduced",
          "The ROM has to be rewritten each time",
          "The screen resolution drops to save memory",
          "Virtual memory encrypts every page, which takes time",
        ],
        why: "Constantly swapping pages between disk and RAM ('disk thrashing') means the CPU spends its time waiting for the disk.",
      },
      {
        q: "Adding more RAM to a computer that was swapping heavily usually helps because:",
        a: "More programs and data fit in fast memory, so less swapping to disk is needed",
        wrong: [
          "It increases the amount of ROM available",
          "It raises the processor's clock speed",
          "It makes the hard disk spin faster",
          "It reduces the size of the operating system",
        ],
        why: "Virtual memory is a fallback; the real fix for thrashing is enough RAM to hold the working set.",
      },
    ],
  }),

  recall({
    key: "cs.cover.secondary-storage",
    topic: "cs-memory",
    subtopic: "secondary-storage",
    level: GCSE,
    cases: [
      {
        q: "Which property most favours an SSD over a hard disk drive in a laptop?",
        a: "It has no moving parts, so it is faster and survives being knocked while running",
        wrong: [
          "It has the lowest cost per gigabyte of any storage",
          "It can be read by the CPU without loading data into RAM",
          "It has unlimited write endurance",
          "It stores data magnetically for longer life",
        ],
        why: "An SSD uses flash memory with no moving parts; an HDD is cheaper per gigabyte but slower and more fragile.",
      },
      {
        q: "A company must archive 200 TB of data cheaply for years, reading it only rarely. Which medium fits best?",
        a: "Magnetic tape",
        wrong: [
          "A solid state drive",
          "An optical disc such as a Blu-ray",
          "Additional RAM",
          "A USB flash drive",
        ],
        why: "Tape has the lowest cost per terabyte and is reliable for write-once archives, though access is serial and slow.",
      },
      {
        q: "Why is an optical disc such as a pressed DVD suitable for distributing software to shops?",
        a: "It is very cheap to produce in bulk and is read-only by nature",
        wrong: [
          "It has the fastest random access of any medium",
          "It can be rewritten by the user thousands of times",
          "It holds more data than any hard disk drive",
          "It needs no drive or reader to access",
        ],
        why: "Pressed discs cost very little at scale and cannot easily be overwritten, which suits mass distribution.",
      },
    ],
  }),

  recall({
    key: "cs.cover.storage-types",
    topic: "cs-memory",
    subtopic: "storage-types",
    level: GCSE,
    cases: [
      {
        q: "How does magnetic storage such as a hard disk drive represent data?",
        a: "As the direction of magnetisation of tiny regions on a spinning platter",
        wrong: [
          "As electrical charge held in flash memory cells",
          "As pits and lands read by a laser",
          "As sound recorded in a spiral groove",
          "As holes punched through a plastic card",
        ],
        why: "A read/write head detects and changes the magnetic polarity of regions as the platter spins beneath it.",
      },
      {
        q: "How does solid state storage represent data?",
        a: "As electrical charge trapped in floating-gate transistors (flash memory)",
        wrong: [
          "As magnetised regions on a rotating disc",
          "As pits and lands on a reflective surface",
          "As the position of mechanical switches",
          "As standing waves in a quartz crystal",
        ],
        why: "Flash cells hold charge that persists without power, and there are no moving parts.",
      },
      {
        q: "How is data read from optical storage such as a Blu-ray disc?",
        a: "A laser detects pits and lands on the disc surface as it spins",
        wrong: [
          "A magnetic head reads the polarity of regions on the disc",
          "An electric current measures the charge in each cell",
          "A stylus follows a groove cut into the disc",
          "The disc is scanned by an electron beam",
        ],
        why: "The transition between a pit and a land encodes the bits; the laser wavelength sets the capacity of CD, DVD and Blu-ray.",
      },
    ],
  }),

  /* -------------------------------------------------- Networks */

  recall({
    key: "cs.cover.network-types",
    topic: "cs-networks",
    subtopic: "network-types",
    level: GCSE,
    cases: [
      {
        q: "A school connects the computers across its single site using cabling it owns. What type of network is this?",
        a: "A local area network (LAN)",
        wrong: [
          "A wide area network (WAN)",
          "A personal area network (PAN)",
          "The internet",
          "A virtual private network (VPN)",
        ],
        why: "A LAN covers one geographical site and its infrastructure belongs to the organisation.",
      },
      {
        q: "Offices in different cities are joined using leased telecommunications links. What type of network is this?",
        a: "A wide area network (WAN)",
        wrong: [
          "A local area network (LAN)",
          "A personal area network (PAN)",
          "A single client–server pair",
          "A peer-to-peer network on one site",
        ],
        why: "A WAN spans a large area and relies on third-party infrastructure such as leased lines or the internet.",
      },
      {
        q: "The internet is best described as which of the following?",
        a: "A global WAN made of many interconnected networks",
        wrong: [
          "A single very large computer",
          "One organisation's private LAN",
          "A protocol for sending email",
          "A type of web browser",
        ],
        why: "The internet is the largest example of a WAN — a network of networks joined by routers and agreed protocols.",
      },
    ],
  }),

  recall({
    key: "cs.cover.topologies",
    topic: "cs-networks",
    subtopic: "topologies",
    cases: [
      {
        q: "In a star topology, what is the effect of one connecting cable failing?",
        a: "Only the device on that cable loses its connection",
        wrong: [
          "The whole network stops working",
          "Every device runs at half speed",
          "Data automatically reroutes through another device",
          "The central switch shuts down for safety",
        ],
        why: "Each device has its own link to the central switch, so a cable fault is isolated — though the switch itself is a single point of failure.",
      },
      {
        q: "What is a drawback of a full mesh topology?",
        a: "It needs a large amount of cabling or many wireless links",
        wrong: [
          "A single break disconnects every device",
          "It cannot use IP addresses",
          "It has no redundancy if a link fails",
          "Only two devices can join it",
        ],
        why: "Every node connects to every other node, so the number of links grows quickly as devices are added.",
      },
      {
        q: "Why are most modern wired office networks built as a star rather than a bus?",
        a: "Each device gets a dedicated link, so there are fewer collisions and faults are easier to find",
        wrong: [
          "A star needs no switch or hub",
          "A bus cannot carry more than two devices",
          "A star uses much less cable than a bus",
          "A bus requires every device to have two network cards",
        ],
        why: "A bus shares one backbone cable, so traffic collides and a single break can bring down the whole segment.",
      },
    ],
  }),

  recall({
    key: "cs.cover.addressing",
    topic: "cs-networks",
    subtopic: "addressing",
    cases: [
      {
        q: "Which address is used to route a packet between different networks across the internet?",
        a: "The IP address",
        wrong: [
          "The MAC address",
          "The default gateway address only",
          "The subnet mask",
          "The host name",
        ],
        why: "IP addresses are hierarchical and assigned by the network, so routers can forward packets towards the destination network.",
      },
      {
        q: "Which address is fixed to the network hardware by the manufacturer and used for delivery within a local network?",
        a: "The MAC address",
        wrong: [
          "The IP address",
          "The subnet mask",
          "The default gateway",
          "The DNS server address",
        ],
        why: "A MAC address is a 48-bit hardware identifier; switches use it to deliver frames on the local segment.",
      },
      {
        q: "Why can a laptop's IP address change while its MAC address normally stays the same?",
        a: "The IP address is assigned by whichever network the laptop joins; the MAC address is built into the network card",
        wrong: [
          "The IP address is chosen by the user and the MAC address by the ISP",
          "The MAC address changes only when the laptop is switched off",
          "Both addresses are reset every time a web page loads",
          "The IP address is stored in ROM and the MAC address in RAM",
        ],
        why: "Join a new network and its DHCP server issues a new IP, but the same physical network card keeps the same MAC.",
      },
    ],
  }),

  recall({
    key: "cs.cover.packet-switching",
    topic: "cs-networks",
    subtopic: "packet-switching",
    cases: [
      {
        q: "In packet switching, what does each packet carry in addition to a piece of the data?",
        a: "Header information such as source and destination addresses and a sequence number",
        wrong: [
          "A complete copy of the whole file",
          "The password of the sender",
          "A list of every router it must pass through",
          "The clock speed of the sending computer",
        ],
        why: "The header lets routers forward the packet and lets the receiver reassemble the packets in the right order.",
      },
      {
        q: "What is an advantage of packet switching over circuit switching?",
        a: "Network capacity is shared efficiently because no single path is reserved for one conversation",
        wrong: [
          "Packets are guaranteed never to need resending",
          "It removes the need for addresses",
          "Every packet always takes the same route",
          "It works without any routers",
        ],
        why: "Packets from many conversations interleave on the same links and can route around congestion or failure.",
      },
      {
        q: "How does the receiving computer cope with packets that arrive out of order?",
        a: "It reorders them using the sequence numbers in their headers",
        wrong: [
          "It discards any packet that arrives out of order",
          "It asks the sender to start the whole transfer again",
          "It processes them in the order they arrive regardless",
          "It sorts them alphabetically by their contents",
        ],
        why: "Because each packet is routed independently, order is not guaranteed in transit; the sequence numbers restore it.",
      },
    ],
  }),

  /* -------------------------------------------------- Cyber security */

  recall({
    key: "cs.cover.social-engineering",
    topic: "cs-security",
    subtopic: "social-engineering",
    level: GCSE,
    cases: [
      {
        q: "What do social engineering attacks have in common?",
        a: "They manipulate a person into giving away information or access, rather than attacking the technology",
        wrong: [
          "They always involve breaking an encryption algorithm",
          "They flood a server with traffic until it fails",
          "They exploit a bug in the operating system",
          "They require physical access to the server room",
        ],
        why: "Phishing, pretexting and baiting all exploit human trust, curiosity or fear — which is why staff training is a key defence.",
      },
      {
        q: "A caller pretends to be from IT support and asks an employee to read out their password to 'fix an account'. What is this?",
        a: "Social engineering (pretexting)",
        wrong: [
          "A brute-force attack",
          "A denial-of-service attack",
          "An SQL injection attack",
          "A packet-sniffing attack",
        ],
        why: "The attacker invents a believable scenario to persuade the victim to hand over credentials.",
      },
      {
        q: "Which measure most directly reduces the success of social engineering?",
        a: "Training staff to recognise and verify suspicious requests before acting on them",
        wrong: [
          "Installing a faster firewall",
          "Increasing the length of the encryption key",
          "Adding more RAM to the mail server",
          "Compressing all outgoing email",
        ],
        why: "Since the target is the person, awareness and clear procedures for verifying requests are the strongest protection.",
      },
    ],
  }),

  recall({
    key: "cs.cover.network-attacks",
    topic: "cs-security",
    subtopic: "network-attacks",
    cases: [
      {
        q: "In a man-in-the-middle attack, what does the attacker do?",
        a: "Secretly relays and possibly alters the communication between two parties who believe they are talking directly",
        wrong: [
          "Encrypts the victim's files and demands a ransom",
          "Overwhelms a server with requests from many machines",
          "Guesses a password by trying every combination",
          "Tricks a user into installing a fake app",
        ],
        why: "By sitting between the two ends the attacker can read or change messages; encryption with verified certificates defeats it.",
      },
      {
        q: "What is the aim of a distributed denial-of-service (DDoS) attack?",
        a: "To flood a target from many compromised machines at once so real users cannot reach it",
        wrong: [
          "To steal a copy of the target's database",
          "To read traffic passing between two users",
          "To insert malicious SQL into an input box",
          "To encrypt the target's backups",
        ],
        why: "Using a botnet multiplies the traffic and makes the source hard to block.",
      },
      {
        q: "How does packet sniffing threaten a network?",
        a: "It captures unencrypted traffic passing over the network, exposing data such as passwords",
        wrong: [
          "It physically cuts the network cable",
          "It changes every device's MAC address",
          "It fills the hard disk with junk files",
          "It slows the CPU clock speed",
        ],
        why: "On a shared or poorly secured network an attacker can read frames not addressed to them; encryption makes the captured data useless.",
      },
    ],
  }),

  recall({
    key: "cs.cover.protection",
    topic: "cs-security",
    subtopic: "protection",
    level: GCSE,
    cases: [
      {
        q: "How does two-factor authentication make an account harder to break into?",
        a: "A stolen password is not enough on its own — a second, separate factor such as a code on the user's phone is also required",
        wrong: [
          "It makes the password twice as long automatically",
          "It encrypts the password database on the server",
          "It blocks all logins from outside the country",
          "It changes the username every time the user logs in",
        ],
        why: "Combining something you know (a password) with something you have (a device) means an attacker needs both, not just one.",
      },
      {
        q: "Why does keeping software patched and up to date improve security?",
        a: "Updates fix known vulnerabilities that attackers would otherwise exploit",
        wrong: [
          "Updates always make the software run faster",
          "Updates remove the need for a firewall",
          "Updates delete any malware already installed",
          "Updates hide the computer from the network",
        ],
        why: "Most successful attacks use flaws that already have a fix available; applying patches promptly closes them.",
      },
      {
        q: "Why does giving each user only the access rights their role needs improve security?",
        a: "It limits the damage a single compromised account can do",
        wrong: [
          "It makes passwords unnecessary",
          "It speeds up the login process",
          "It encrypts the whole hard drive",
          "It prevents the network from being scanned",
        ],
        why: "The principle of least privilege means a stolen account cannot reach data or systems outside its role.",
      },
      {
        q: "Why is an off-site backup considered a security measure and not only a safety measure?",
        a: "It allows recovery without paying if data is encrypted or destroyed by an attack",
        wrong: [
          "It prevents attackers from ever reaching the network",
          "It makes the original files load faster",
          "It automatically identifies the attacker",
          "It encrypts traffic as it leaves the building",
        ],
        why: "An offline or off-site backup means ransomware and sabotage lose their leverage.",
      },
    ],
  }),

  recall({
    key: "cs.cover.encryption",
    topic: "cs-security",
    subtopic: "encryption",
    cases: [
      {
        q: "What does encryption do to data?",
        a: "Scrambles it using a key so that only someone with the correct key can read it",
        wrong: [
          "Compresses it so it transfers faster",
          "Deletes it after a set period of time",
          "Copies it to a secure server automatically",
          "Splits it into packets for sending",
        ],
        why: "Encryption transforms plaintext into ciphertext; without the key the ciphertext is meaningless.",
      },
      {
        q: "Encrypted data is intercepted while crossing the internet. What can the attacker do with it?",
        a: "Nothing useful — they see only ciphertext and do not have the decryption key",
        wrong: [
          "Read it immediately, because interception breaks encryption",
          "Decrypt it using the sender's IP address",
          "Use it to shut down the sender's computer",
          "Convert it back to plaintext by compressing it",
        ],
        why: "Interception still happens, but encryption removes the value of what is intercepted.",
      },
      {
        q: "In symmetric encryption, what is used to encrypt and to decrypt the data?",
        a: "The same secret key at both ends",
        wrong: [
          "A public key to encrypt and a private key to decrypt",
          "No key at all — just an agreed algorithm",
          "A new random key for every character",
          "The recipient's MAC address",
        ],
        why: "Symmetric encryption is fast but the key must be shared securely; asymmetric encryption uses a public/private key pair instead.",
      },
    ],
  }),

  /* -------------------------------------------------- Databases */

  recall({
    key: "cs.cover.keys",
    topic: "cs-databases",
    subtopic: "keys",
    cases: [
      {
        q: "What is a primary key?",
        a: "A field whose value uniquely identifies each record in a table",
        wrong: [
          "A field that links to another table",
          "The first field added to the table",
          "A password that protects the table",
          "A field that may be left empty",
        ],
        why: "No two records share a primary key value and it is never empty, so it identifies any record without ambiguity.",
      },
      {
        q: "What is a foreign key?",
        a: "A field in one table that holds the primary key value of a record in another table",
        wrong: [
          "A key that is only valid on a different computer",
          "A backup copy of the primary key",
          "A field that is unique within its own table",
          "The key used to encrypt the database",
        ],
        why: "The foreign key is how a relationship between two tables is stored, letting the database join related records.",
      },
      {
        q: "A Booking table has a CustomerID field that matches the CustomerID primary key of the Customer table. In the Booking table, CustomerID is:",
        a: "A foreign key",
        wrong: [
          "The primary key of the Booking table",
          "A composite key",
          "An index that is not a key",
          "A duplicate that should be removed",
        ],
        why: "It links each booking to a customer by storing that customer's primary key value.",
      },
      {
        q: "Why might a database designer use a composite key?",
        a: "Because no single field is unique, so two or more fields together identify a record",
        wrong: [
          "To make the table load faster",
          "Because every table must have at least two keys",
          "To store the key in two places for safety",
          "Because foreign keys are not allowed otherwise",
        ],
        why: "A class register, for example, might need both StudentID and Date to identify one attendance record.",
      },
    ],
  }),
];
