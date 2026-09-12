/**
 * Networking (A-Level): the TCP/IP stack, subnet masks, and asymmetric
 * encryption.
 *
 * Subnet questions are computed with the actual bitwise AND of the address and
 * mask and re-checked; the layered-model and public-key questions are worked
 * recall.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

export const csALevelNetworks: Generator[] = [
  recall({
    key: "cs.anet.tcp-ip",
    topic: "cs-networks",
    subtopic: "tcp-ip",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "In the four-layer TCP/IP model, which layer do HTTP, SMTP and FTP belong to?",
        a: "The application layer",
        wrong: ["The transport layer", "The internet (network) layer", "The link (network access) layer", "The presentation layer"],
        why: "The application layer provides the protocols that programs use directly; lower layers just move the bytes.",
      },
      {
        q: "Which TCP/IP layer is responsible for splitting a message into packets, numbering them, and reassembling them in order?",
        a: "The transport layer",
        wrong: ["The application layer", "The internet layer", "The link layer", "The session layer"],
        why: "TCP lives here; it adds port numbers and sequence numbers and handles retransmission.",
      },
      {
        q: "Which TCP/IP layer adds the source and destination IP addresses and decides the route across networks?",
        a: "The internet (network) layer",
        wrong: ["The transport layer", "The application layer", "The link layer", "The physical layer"],
        why: "IP operates here, routing each packet hop by hop toward its destination network.",
      },
      {
        q: "Which TCP/IP layer deals with MAC addresses and putting bits onto the physical medium?",
        a: "The link (network access) layer",
        wrong: ["The internet layer", "The transport layer", "The application layer", "The transport and internet layers together"],
        why: "The link layer covers the local hop: Ethernet framing, MAC addressing and the physical signalling.",
      },
      {
        q: "As data passes down the sending computer's TCP/IP stack, what happens at each layer?",
        a: "Each layer adds its own header (encapsulation); the receiver's matching layer removes it",
        wrong: [
          "Each layer encrypts the data with a different key",
          "Each layer compresses the data further",
          "Each layer splits the data into two halves",
          "The data is converted to a different number base at each layer",
        ],
        why: "Headers are peeled off in reverse order on the way up the receiver's stack.",
      },
      {
        q: "Why is a layered model such as TCP/IP useful to network engineers?",
        a: "A protocol at one layer can be changed or replaced without affecting the layers above or below it",
        wrong: [
          "It makes the network run at a higher clock speed",
          "It removes the need for physical cables",
          "It guarantees that no packet is ever lost",
          "It means only one protocol is ever needed for the whole stack",
        ],
        why: "Well-defined interfaces between layers keep concerns separate — Wi-Fi can replace Ethernet with no change to TCP or HTTP.",
      },
    ],
  }),

  generator({
    key: "cs.anet.subnet-network",
    subject: "computer-science",
    topic: "cs-networks",
    subtopic: "subnetting",
    curriculumLevel: Y13,
    difficulty: 7,
    variants: 12,
    build: (rng) => {
      const prefix = rng.pick([25, 26, 27, 28] as const);
      const blockSize = 2 ** (32 - prefix); // size of each subnet in the last octet
      const maskOctet = 256 - blockSize;
      const host = rng.int(blockSize + 1, 254); // beyond the first block, so the network address is non-zero
      const network = Math.floor(host / blockSize) * blockSize;
      const broadcast = network + blockSize - 1;
      const base = `192.168.10.`;
      const answer = `${base}${network}`;
      return {
        prompt: code([
          [0, `A host has IP address ${base}${host} with a /${prefix} subnet mask (255.255.255.${maskOctet}).`],
          [0, "What is the network (subnet) address for this host?"],
        ]),
        answer,
        distractors: othersFrom(answer, [
          `${base}${host}`, // gave the host address
          `${base}0`, // assumed a /24
          `${base}${broadcast}`, // gave the broadcast address
          `${base}${network + 1}`, // gave the first usable host
          `${base}${Math.floor(host / (blockSize * 2)) * (blockSize * 2)}`,
        ]),
        explanation:
          `A /${prefix} mask splits the last octet into blocks of ${blockSize}. ` +
          `${host} falls in the block starting at ${network} (${network} to ${broadcast}), so the network address is ${base}${network}.`,
        check: () => {
          const n = host & maskOctet;
          return n === network ? null : "subnet AND mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.anet.subnet-hosts",
    subject: "computer-science",
    topic: "cs-networks",
    subtopic: "subnetting",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 7,
    build: (_rng, index) => {
      const prefixes = [24, 25, 26, 27, 28, 29, 30] as const;
      const prefix = prefixes[index % prefixes.length];
      const hostBits = 32 - prefix;
      const usable = 2 ** hostBits - 2;
      const answer = String(usable);
      return {
        prompt: `How many usable host addresses does a /${prefix} IPv4 subnet provide? (Exclude the network address and the broadcast address.)`,
        answer,
        distractors: pickDistractors(answer, [
          String(2 ** hostBits), // forgot to subtract network and broadcast
          String(2 ** hostBits - 1), // subtracted only one
          String(2 ** (hostBits + 1) - 2),
          String(Math.max(0, 2 ** (hostBits - 1) - 2)),
          String(hostBits),
        ]),
        explanation:
          `A /${prefix} leaves ${hostBits} host bits, giving 2^${hostBits} = ${2 ** hostBits} addresses. ` +
          `Two are reserved (network and broadcast), so ${usable} are usable.`,
        check: () => (2 ** (32 - prefix) - 2 === usable ? null : "host count mismatch"),
      };
    },
  }),

  recall({
    key: "cs.anet.asymmetric",
    topic: "cs-security",
    subtopic: "asymmetric-encryption",
    level: Y12,
    difficulty: 6,
    cases: [
      {
        q: "In asymmetric (public-key) encryption, which key is used to encrypt a message so that only the intended recipient can read it?",
        a: "The recipient's public key",
        wrong: [
          "The recipient's private key",
          "The sender's public key",
          "The sender's private key",
          "A shared secret key agreed in advance",
        ],
        why: "Anyone can encrypt with the public key, but only the matching private key — held only by the recipient — can decrypt.",
      },
      {
        q: "How does a digital signature let a recipient verify who sent a message?",
        a: "The sender encrypts a hash of the message with their private key; anyone can check it with the sender's public key",
        wrong: [
          "The sender encrypts the whole message with the recipient's public key",
          "The message is sent over an encrypted channel so the source is guaranteed",
          "The sender includes their password in the message header",
          "The recipient's private key is used to sign the message",
        ],
        why: "Only the real sender could have produced a signature that their public key successfully verifies.",
      },
      {
        q: "What is the main practical drawback of asymmetric encryption compared with symmetric encryption?",
        a: "It is much slower, so it is often used only to exchange a symmetric key for the bulk data",
        wrong: [
          "It is far less secure for the same key length",
          "It cannot be used over the internet",
          "Both parties must meet in person first",
          "It can only encrypt very short messages, never a symmetric key",
        ],
        why: "TLS uses asymmetric crypto for the handshake and key exchange, then fast symmetric crypto for the session.",
      },
      {
        q: "What problem does a digital certificate issued by a certificate authority solve?",
        a: "It vouches that a given public key really belongs to the organisation claiming it",
        wrong: [
          "It encrypts the connection without needing any keys",
          "It stores the user's private key safely in the cloud",
          "It speeds up the asymmetric encryption calculation",
          "It replaces the need for passwords entirely",
        ],
        why: "Without a trusted third party, an attacker could substitute their own public key in a man-in-the-middle attack.",
      },
      {
        q: "Why can a public key be shared openly without weakening the encryption?",
        a: "Deriving the private key from the public key requires a calculation that is computationally infeasible",
        wrong: [
          "The public key is changed after every message",
          "The public key only works for one specific message",
          "The public key is itself encrypted before sharing",
          "Anyone with the public key must still know a password",
        ],
        why: "Schemes like RSA rest on hard problems (factoring large numbers) that make reversing the key impractical.",
      },
      {
        q: "What is 'hashing' used for when a website stores user passwords?",
        a: "The password is run through a one-way function and only the hash is stored, so the plaintext is never kept",
        wrong: [
          "The password is encrypted with the site's private key",
          "The password is compressed to save database space",
          "The password is split across several database tables",
          "The password is converted to hexadecimal for readability",
        ],
        why: "At login the entered password is hashed and compared; a stolen database yields only hashes, not passwords (especially if salted).",
      },
    ],
  }),
];
