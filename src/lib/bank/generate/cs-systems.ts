/**
 * Systems architecture, memory and storage, networks, and cyber security.
 *
 * These topics are recall and reasoning rather than arithmetic, so the
 * generators follow the same shape the biology recall generators use: a table
 * of question / answer / four real wrong answers / the reason. Every wrong
 * answer is a genuine alternative from the same topic — another CPU register,
 * another protocol, another kind of malware — so the question tests knowledge
 * rather than reading.
 *
 * A handful of quantitative items (clock speed, network transfer time) are
 * computed and checked.
 */

import { generator, pickDistractors, Rng, type Generator } from "./kit";
import { othersFrom } from "./cs-kit";

const GCSE = "YEAR_10" as const;
const GCSE_LATE = "YEAR_11" as const;
const A_LEVEL = "YEAR_12" as const;

interface Recall {
  q: string;
  a: string;
  wrong: readonly [string, string, string, string];
  why: string;
}

const fromCases = (cases: readonly Recall[]) => (rng: Rng) => {
  const c = cases[rng.int(0, cases.length - 1)];
  return {
    prompt: c.q,
    answer: c.a,
    distractors: pickDistractors(c.a, c.wrong),
    explanation: `${c.a}. ${c.why}`,
  };
};

/* ==========================================================================
   Systems architecture
   ========================================================================== */

const ARCHITECTURE: readonly Recall[] = [
  {
    q: "In the fetch–execute cycle, which register holds the address of the next instruction to be fetched?",
    a: "The program counter (PC)",
    wrong: [
      "The memory address register (MAR)",
      "The memory data register (MDR)",
      "The accumulator (ACC)",
      "The current instruction register (CIR)",
    ],
    why: "The program counter stores the address of the next instruction; it is copied into the MAR during a fetch and then incremented.",
  },
  {
    q: "Which register temporarily holds data or an instruction that has just been read from, or is about to be written to, memory?",
    a: "The memory data register (MDR)",
    wrong: [
      "The memory address register (MAR)",
      "The program counter (PC)",
      "The current instruction register (CIR)",
      "The status register",
    ],
    why: "The MDR is the buffer between the CPU and memory; the MAR holds the address, the MDR holds the value at that address.",
  },
  {
    q: "Where in the CPU are arithmetic and logical operations such as addition and comparison carried out?",
    a: "The arithmetic logic unit (ALU)",
    wrong: [
      "The control unit (CU)",
      "The cache",
      "The program counter",
      "The memory address register",
    ],
    why: "The ALU performs calculations and logic; the control unit only directs the flow of data and decodes instructions.",
  },
  {
    q: "What is the role of the control unit (CU) in the CPU?",
    a: "It decodes instructions and coordinates the other components",
    wrong: [
      "It performs all arithmetic and logical calculations",
      "It provides high-speed storage for frequently used data",
      "It holds the address of the next instruction",
      "It stores the operating system while the computer is on",
    ],
    why: "The control unit fetches and decodes each instruction and sends control signals that tell the ALU, registers and buses what to do.",
  },
  {
    q: "In the von Neumann architecture, where are program instructions and the data they operate on stored?",
    a: "Together in the same main memory",
    wrong: [
      "In two physically separate memories",
      "Instructions in the CPU registers, data in RAM",
      "Instructions in ROM, data in cache only",
      "Both permanently in secondary storage",
    ],
    why: "A von Neumann machine holds instructions and data in one shared memory and uses one bus to reach it, which is why it can only fetch one at a time.",
  },
  {
    q: "Increasing which CPU property allows more fetch–execute cycles to be carried out each second?",
    a: "Clock speed",
    wrong: [
      "Cache size",
      "Word length",
      "The number of buses",
      "The amount of virtual memory",
    ],
    why: "Clock speed is the number of cycles per second, measured in hertz; a larger cache and more cores also help performance but by different mechanisms.",
  },
  {
    q: "Why does adding more cache memory usually improve CPU performance?",
    a: "Frequently used instructions and data can be fetched without waiting for slower RAM",
    wrong: [
      "It increases the number of instructions executed per clock cycle to more than one automatically",
      "It permanently stores the operating system so it never needs reloading",
      "It raises the clock speed of the processor",
      "It lets the CPU address a larger total amount of memory",
    ],
    why: "Cache sits between the CPU and RAM and is much faster; a cache hit avoids a slow main-memory access.",
  },
  {
    q: "What best describes an embedded system?",
    a: "A computer built into a larger device to perform a dedicated function",
    wrong: [
      "A general-purpose computer that can run any application the user installs",
      "A server that hosts websites for many users at once",
      "A removable storage device used to back up files",
      "Software that translates high-level code into machine code",
    ],
    why: "Embedded systems — in a washing machine, a car engine controller, a router — do one job, so they can be smaller, cheaper and more reliable than a PC.",
  },
  {
    q: "In the fetch–execute cycle, what happens immediately after the instruction is copied into the CPU?",
    a: "The program counter is incremented so it points at the next instruction",
    wrong: [
      "The result is written back to secondary storage",
      "The ALU adds the two operands together",
      "The instruction is deleted from main memory",
      "The clock speed is increased for the next cycle",
    ],
    why: "The PC is incremented early in the cycle so that, once the current instruction has been decoded and executed, the CPU already knows where to fetch next.",
  },
];

/* ==========================================================================
   Memory and storage
   ========================================================================== */

const MEMORY: readonly Recall[] = [
  {
    q: "Which type of memory is volatile, meaning its contents are lost when power is removed?",
    a: "RAM",
    wrong: ["ROM", "A solid state drive (SSD)", "An optical disc", "Cache stored on the hard disk"],
    why: "RAM loses its contents without power; ROM keeps them, which is why the boot instructions are stored in ROM.",
  },
  {
    q: "What is stored in ROM on a typical computer?",
    a: "The start-up instructions that run when the computer is switched on",
    wrong: [
      "The user's documents and downloads",
      "The programs the user is currently running",
      "Temporary web pages and browser history",
      "A backup copy of the whole operating system that is edited daily",
    ],
    why: "ROM is non-volatile and normally read-only, so it holds the small, unchanging bootstrap program that loads the operating system from secondary storage.",
  },
  {
    q: "A computer runs out of RAM while several programs are open. What does the operating system do to keep them running?",
    a: "It moves data that is not currently needed from RAM to a paging area on secondary storage (virtual memory)",
    wrong: [
      "It deletes the least recently used program from the disk",
      "It increases the clock speed of the CPU to compensate",
      "It compresses the contents of ROM to make room",
      "It refuses to open any further files until the computer restarts",
    ],
    why: "Virtual memory swaps pages between RAM and disk. It lets more run at once but is much slower than RAM, so heavy swapping (disk thrashing) makes the machine sluggish.",
  },
  {
    q: "Which secondary storage technology has no moving parts and uses flash memory?",
    a: "A solid state drive (SSD)",
    wrong: [
      "A hard disk drive (HDD)",
      "A magnetic tape",
      "An optical disc such as a DVD",
      "A floppy disk",
    ],
    why: "An SSD stores data in flash memory cells, so it is faster, quieter and more shock-resistant than a spinning magnetic HDD, though usually more expensive per gigabyte.",
  },
  {
    q: "How is data physically stored on an optical disc such as a Blu-ray?",
    a: "As pits and lands on the surface that are read by a laser",
    wrong: [
      "As magnetised regions on a spinning platter",
      "As electrical charge trapped in flash memory cells",
      "As holes punched through a plastic card",
      "As sound waves recorded in a groove",
    ],
    why: "A laser reads the change between pits and lands as the disc spins. Magnetic patterns are how hard disks and tapes work; charge in cells is how flash storage works.",
  },
  {
    q: "Which storage medium is still widely used for large, long-term backups because of its very low cost per terabyte?",
    a: "Magnetic tape",
    wrong: [
      "A solid state drive",
      "An optical disc",
      "RAM",
      "A USB flash drive",
    ],
    why: "Tape is cheap and dense but only allows serial access, which is fine for archives that are written once and rarely read.",
  },
  {
    q: "Why is secondary storage needed in addition to RAM?",
    a: "It provides non-volatile storage so programs and files are kept when the computer is off",
    wrong: [
      "It is faster than RAM for the CPU to access directly",
      "The CPU can execute instructions straight from it without loading them into RAM",
      "It replaces the need for an operating system",
      "It stores the fetch–execute cycle",
    ],
    why: "RAM is fast but volatile and limited in size; secondary storage is slower but keeps data permanently and cheaply.",
  },
];

/* ==========================================================================
   Networks
   ========================================================================== */

const NETWORKS: readonly Recall[] = [
  {
    q: "Which term describes a network that connects devices over a small geographical area such as a single site, where the organisation owns the cabling?",
    a: "A local area network (LAN)",
    wrong: [
      "A wide area network (WAN)",
      "A personal area network using Bluetooth only",
      "The internet",
      "A virtual private network (VPN)",
    ],
    why: "A LAN covers one site and its infrastructure is owned by the organisation; a WAN connects LANs over large distances using infrastructure that is usually leased.",
  },
  {
    q: "In a star network topology, what are all the devices connected to?",
    a: "A central switch or hub",
    wrong: [
      "A single shared backbone cable",
      "Each other directly, forming a ring",
      "The nearest two devices only",
      "A wireless access point that must also reach the internet",
    ],
    why: "Every node in a star has its own cable to a central switch. One failed cable takes out only one device, but the central switch is a single point of failure.",
  },
  {
    q: "What is the main advantage of a mesh topology over a star topology?",
    a: "There is no single point of failure because data can take multiple routes",
    wrong: [
      "It uses far less cabling than any other topology",
      "It does not need any network switches at all",
      "Every device is guaranteed a faster connection than on a star",
      "It removes the need for IP addresses",
    ],
    why: "In a full mesh every node links to every other node, so traffic reroutes around a break — at the cost of a lot of cabling or radio links.",
  },
  {
    q: "Which protocol is responsible for delivering email from the sender's device to the sending mail server?",
    a: "SMTP",
    wrong: ["IMAP", "POP3", "HTTP", "FTP"],
    why: "SMTP sends mail out. IMAP and POP3 are used by a client to retrieve mail from a server; IMAP keeps it on the server, POP3 downloads and removes it.",
  },
  {
    q: "Which protocol securely transfers web pages by encrypting the traffic with TLS?",
    a: "HTTPS",
    wrong: ["HTTP", "FTP", "DNS", "DHCP"],
    why: "HTTPS is HTTP running over an encrypted TLS connection, so a network eavesdropper sees only ciphertext.",
  },
  {
    q: "What does the DNS do when you type a website address into a browser?",
    a: "It translates the domain name into the IP address of the server",
    wrong: [
      "It encrypts the connection to the website",
      "It splits the request into packets and routes them",
      "It assigns your device a local IP address",
      "It compresses the web page before it is sent",
    ],
    why: "The Domain Name System is a distributed lookup from human-readable names to IP addresses; without it you would have to remember numeric addresses.",
  },
  {
    q: "Which addressing identifier is assigned by the manufacturer, fixed to the network interface, and used to deliver a frame within a local network?",
    a: "The MAC address",
    wrong: [
      "The IP address",
      "The default gateway",
      "The subnet mask",
      "The host name",
    ],
    why: "A MAC address is a permanent 48-bit hardware identifier used for local delivery; an IP address is assigned by the network and can change, and is used for routing between networks.",
  },
  {
    q: "In packet switching, why might the packets of one message arrive out of order?",
    a: "Each packet is routed independently and may take a different path across the network",
    wrong: [
      "The sender deliberately shuffles them for security",
      "Routers store all packets until the last one arrives, then send them randomly",
      "Packets are always sent in reverse order and reversed again on receipt",
      "The receiving device processes them alphabetically by content",
    ],
    why: "Routers forward each packet by the best route available at that moment, so packets can overtake one another; sequence numbers let the receiver reassemble them correctly.",
  },
  {
    q: "What is the purpose of splitting the network stack into layers such as the TCP/IP model?",
    a: "Each layer handles one part of communication and can be developed or changed independently",
    wrong: [
      "It makes the data travel faster by skipping unused layers",
      "It encrypts the data once per layer for extra security",
      "It removes the need for protocols within a network",
      "It guarantees that packets never need to be retransmitted",
    ],
    why: "Layering is a separation of concerns: the application layer does not need to know how bits cross a cable, and a new physical technology does not require rewriting applications.",
  },
];

/* ==========================================================================
   Cyber security
   ========================================================================== */

const SECURITY: readonly Recall[] = [
  {
    q: "Which type of malware disguises itself as a legitimate program to trick the user into installing it, but does not replicate itself?",
    a: "A Trojan",
    wrong: [
      "A worm",
      "A virus",
      "A rootkit that spreads over the network",
      "Ransomware that copies itself to every drive",
    ],
    why: "A Trojan relies on the user running it and does not self-replicate. A virus attaches to files and needs them to be run; a worm spreads by itself across a network.",
  },
  {
    q: "Which type of malware spreads across a network by itself, without needing the user to run an infected file?",
    a: "A worm",
    wrong: [
      "A Trojan",
      "A macro virus",
      "Spyware installed from a website",
      "A logic bomb",
    ],
    why: "A worm exploits vulnerabilities to copy itself from machine to machine automatically, which is why an outbreak can spread so quickly.",
  },
  {
    q: "An attacker sends an email that appears to be from a bank, asking the recipient to confirm their login details on a fake site. What is this an example of?",
    a: "Phishing",
    wrong: [
      "A brute-force attack",
      "An SQL injection attack",
      "A denial-of-service attack",
      "A man-in-the-middle attack",
    ],
    why: "Phishing is social engineering: it manipulates the person rather than the technology, tricking them into handing over information or money.",
  },
  {
    q: "What is the aim of a denial-of-service (DoS) attack?",
    a: "To overwhelm a server with requests so that legitimate users cannot access it",
    wrong: [
      "To steal a copy of the server's database",
      "To read data as it travels between two users",
      "To guess a user's password by trying every combination",
      "To insert malicious SQL into an input box",
    ],
    why: "A DoS attack floods a target with traffic to exhaust its resources; a distributed version (DDoS) uses many compromised machines at once.",
  },
  {
    q: "Which attack inserts malicious database commands into a website input field that does not check its input?",
    a: "SQL injection",
    wrong: [
      "A denial-of-service attack",
      "Phishing",
      "A brute-force attack",
      "Packet sniffing",
    ],
    why: "If user input is concatenated straight into a query, an attacker can change what the query does. Validating input and using parameterised queries prevents it.",
  },
  {
    q: "Which measure most directly reduces the risk of a brute-force attack succeeding on user accounts?",
    a: "Locking an account after a small number of failed login attempts",
    wrong: [
      "Installing anti-virus software on the server",
      "Compressing the password database",
      "Using HTTPS for the login page only",
      "Increasing the server's clock speed",
    ],
    why: "A brute-force attack depends on making many guesses quickly; a lockout, a delay between attempts, and strong password rules all cut the number of guesses possible.",
  },
  {
    q: "What is the purpose of penetration testing?",
    a: "To deliberately attack a system with permission in order to find weaknesses before a real attacker does",
    wrong: [
      "To recover data after it has already been stolen",
      "To encrypt all of an organisation's files automatically",
      "To train staff to recognise phishing emails",
      "To back up the network configuration",
    ],
    why: "Penetration testers act as an attacker would, then report the vulnerabilities so they can be fixed. It is authorised, which is what separates it from a real attack.",
  },
  {
    q: "Why does a firewall improve network security?",
    a: "It inspects incoming and outgoing traffic and blocks anything that breaks its rules",
    wrong: [
      "It scans files already on the disk for known viruses",
      "It encrypts the hard drive so stolen disks cannot be read",
      "It creates regular backups of user data",
      "It hides the network's existence from every other device",
    ],
    why: "A firewall enforces a boundary policy — for example allowing web traffic out but blocking unsolicited connections in — so it controls what can reach the machines behind it.",
  },
  {
    q: "What does encrypting data achieve if an attacker manages to intercept it?",
    a: "The attacker sees only ciphertext and cannot read the data without the key",
    wrong: [
      "The data cannot be intercepted at all",
      "The data is automatically deleted when read by the wrong person",
      "The data travels faster because it is smaller",
      "The attacker's computer is disabled",
    ],
    why: "Encryption transforms plaintext into ciphertext using a key. Interception still happens, but the intercepted data is useless without the decryption key.",
  },
];

/* ==========================================================================
   Quantitative items
   ========================================================================== */

export const csSystems: Generator[] = [
  generator({
    key: "cs.arch.recall",
    subject: "computer-science",
    topic: "cs-architecture",
    subtopic: "cpu-components",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: ARCHITECTURE.length,
    build: fromCases(ARCHITECTURE),
  }),

  generator({
    key: "cs.arch.fetch-execute",
    subject: "computer-science",
    topic: "cs-architecture",
    subtopic: "fetch-execute",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 4,
    build: (rng) => {
      const steps = [
        "The address in the program counter is copied to the memory address register",
        "The instruction at that address is fetched into the memory data register",
        "The instruction is copied to the current instruction register and the program counter is incremented",
        "The control unit decodes the instruction",
        "The instruction is executed, using the ALU if a calculation is needed",
      ];
      const missing = rng.int(1, 4);
      const answer = steps[missing];

      return {
        prompt:
          `The fetch–execute cycle runs in this order:\n` +
          steps.map((s, i) => `${i + 1}. ${i === missing ? "________" : s}`).join("\n") +
          `\nWhat belongs at step ${missing + 1}?`,
        answer,
        distractors: othersFrom(answer, [
          ...steps.filter((s) => s !== answer),
          "The result is written back to secondary storage",
          "The clock speed is doubled for the next instruction",
        ]),
        explanation:
          `The cycle is: fetch (PC → MAR, memory → MDR → CIR, increment PC), decode, execute. ` +
          `Step ${missing + 1} is "${answer}".`,
      };
    },
  }),

  generator({
    key: "cs.arch.clock-speed",
    subject: "computer-science",
    topic: "cs-architecture",
    subtopic: "cpu-performance",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const ghz = rng.pick([1.5, 2, 2.4, 3, 3.6] as const);
      const cyclesPerInstruction = rng.pick([1, 2, 4] as const);
      const instructionsPerSecond = (ghz * 1e9) / cyclesPerInstruction;
      const answer = `${formatCount(instructionsPerSecond)} instructions per second`;

      return {
        prompt:
          `A single-core CPU runs at ${ghz} GHz and takes ${cyclesPerInstruction} clock cycle` +
          `${cyclesPerInstruction === 1 ? "" : "s"} per instruction. Roughly how many instructions can it execute per second?`,
        answer,
        distractors: pickDistractors(answer, [
          `${formatCount(ghz * 1e9 * cyclesPerInstruction)} instructions per second`, // multiplied instead of divided
          `${formatCount(ghz * 1e6 / cyclesPerInstruction)} instructions per second`, // GHz read as MHz
          `${formatCount(ghz / cyclesPerInstruction)} instructions per second`,
          `${ghz} billion instructions per second regardless of the cycle count`,
        ]),
        explanation:
          `${ghz} GHz is ${formatCount(ghz * 1e9)} cycles per second. ` +
          `Dividing by ${cyclesPerInstruction} cycle${cyclesPerInstruction === 1 ? "" : "s"} per instruction gives ` +
          `${formatCount(instructionsPerSecond)} instructions per second.`,
        check: () =>
          Math.abs((ghz * 1e9) / cyclesPerInstruction - instructionsPerSecond) < 1
            ? null
            : "rate mismatch",
      };
    },
  }),

  generator({
    key: "cs.mem.recall",
    subject: "computer-science",
    topic: "cs-memory",
    subtopic: "ram-rom",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: MEMORY.length,
    build: fromCases(MEMORY),
  }),

  generator({
    key: "cs.net.recall",
    subject: "computer-science",
    topic: "cs-networks",
    subtopic: "protocols",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: NETWORKS.length,
    build: fromCases(NETWORKS),
  }),

  generator({
    key: "cs.net.transfer-time",
    subject: "computer-science",
    topic: "cs-networks",
    subtopic: "network-performance",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const megabytes = rng.int(2, 90);
      const megabitsPerSecond = rng.pick([8, 16, 20, 40, 50] as const);
      const bits = megabytes * 8 * 1e6;
      const seconds = bits / (megabitsPerSecond * 1e6);
      const answer = `${trimNumber(seconds)} seconds`;

      return {
        prompt:
          `A file of ${megabytes} MB is downloaded over a connection with a speed of ` +
          `${megabitsPerSecond} Mbps (megabits per second). Assuming no overhead, how long does the download take?`,
        answer,
        distractors: pickDistractors(answer, [
          `${trimNumber(megabytes / megabitsPerSecond)} seconds`, // forgot bytes → bits
          `${trimNumber(seconds * 8)} seconds`,
          `${trimNumber(seconds / 8)} seconds`,
          `${trimNumber(megabytes * megabitsPerSecond)} seconds`,
        ]),
        explanation:
          `Convert the file to bits: ${megabytes} MB × 8 = ${megabytes * 8} Mb. ` +
          `Divide by the line speed: ${megabytes * 8} ÷ ${megabitsPerSecond} = ${trimNumber(seconds)} seconds. ` +
          `The units trap is that speed is in megabits but file size is in megabytes.`,
        check: () =>
          Math.abs((megabytes * 8) / megabitsPerSecond - seconds) < 1e-9 ? null : "time mismatch",
      };
    },
  }),

  generator({
    key: "cs.sec.recall",
    subject: "computer-science",
    topic: "cs-security",
    subtopic: "malware",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: SECURITY.length,
    build: fromCases(SECURITY),
  }),
];

/* -------------------------------------------------------------------------- */

function formatCount(n: number): string {
  if (n >= 1e9) return `${trimNumber(n / 1e9)} billion`;
  if (n >= 1e6) return `${trimNumber(n / 1e6)} million`;
  if (n >= 1e3) return `${trimNumber(n / 1e3)} thousand`;
  return trimNumber(n);
}

function trimNumber(n: number): string {
  return Number(n.toFixed(4))
    .toString()
    .replace(/\.0+$/, "");
}
