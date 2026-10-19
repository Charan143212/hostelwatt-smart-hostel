export const hostelBlocks = ["MH1", "MH2", "MH3", "MH4", "MH5", "MH6", "MH7", "LH1", "LH2", "LH3", "LH4"] as const;
export type HostelBlock = (typeof hostelBlocks)[number];

export type RoomStatus = "Occupied" | "Vacant" | "High Usage" | "Normal" | "Alert";

export type Room = {
  id: string;
  number: string;
  block: HostelBlock;
  occupancy: number;
  power: number;
  current: number;
  voltage: number;
  relays: { light: boolean; fan: boolean; socket: boolean };
  hardwareNodeId: string;
  online: boolean;
  latencyMs: number;
  lastActivity: string;
  energyTodayKwh: number;
  status: RoomStatus;
};

/** Hostel + room form the hardware identity, e.g. ESP32_MH1_ROOM_304. */
export function hardwareNodeId(block: HostelBlock, room: string) {
  return `ESP32_${block}_ROOM_${room}`;
}

const roomNumbers = ["101", "102", "103", "104", "105", "201", "202", "203", "204", "205", "301", "302", "303", "304", "305"];

// [occupancy, watts] per room — deterministic demo values, rotated per hostel.
const baseProfile: Array<[number, number]> = [[2, 142.4], [1, 174.0], [3, 186.2], [1, 62.5], [0, 0], [2, 96.1], [0, 0], [4, 231.7], [1, 58.3], [4, 392.0], [2, 118.9], [1, 39.8], [0, 0], [2, 48.5], [0, 0]];
const profiles = Object.fromEntries(
  hostelBlocks.map((block, b) => [block, block === "MH1" ? baseProfile : baseProfile.map((_, i) => baseProfile[(i + b * 4) % baseProfile.length] ?? [0, 0])]),
) as Record<HostelBlock, Array<[number, number]>>;

const activity = ["2 min ago", "just now", "5 min ago", "12 min ago", "1 min ago", "8 min ago", "3 min ago"];

function statusFor(occupancy: number, power: number, online: boolean): RoomStatus {
  if (!online) return "Alert";
  if (power >= 250) return "High Usage";
  if (occupancy === 0) return "Vacant";
  return occupancy >= 3 ? "Occupied" : "Normal";
}

export const rooms: Room[] = hostelBlocks.flatMap((block) =>
  roomNumbers.map((number, i) => {
    const [occupancy, power] = profiles[block][i] ?? [0, 0];
    const online = !(block === "MH2" && number === "302");
    return {
      id: `${block}-${number}`,
      number,
      block,
      occupancy,
      power,
      voltage: 230,
      current: +(power / 230).toFixed(2),
      relays: { light: occupancy > 0, fan: occupancy > 0, socket: occupancy > 0 },
      hardwareNodeId: hardwareNodeId(block, number),
      online,
      latencyMs: 34 + ((i * 7) % 19),
      lastActivity: activity[i % activity.length] ?? "just now",
      energyTodayKwh: +((power * 9) / 1000 + occupancy * 0.15).toFixed(2),
      status: statusFor(occupancy, power, online),
    };
  }),
);

export function roomsInBlocks(blocks: readonly HostelBlock[]) {
  return rooms.filter((room) => blocks.includes(room.block));
}

export function findRoom(block: HostelBlock, number: string) {
  return rooms.find((room) => room.block === block && room.number === number);
}

export const dailyConsumption = [
  { day: "Mon", baseline: 3.2, actual: 3.0 },
  { day: "Tue", baseline: 3.3, actual: 2.7 },
  { day: "Wed", baseline: 3.1, actual: 2.4 },
  { day: "Thu", baseline: 3.4, actual: 2.2 },
  { day: "Fri", baseline: 3.2, actual: 1.9 },
  { day: "Sat", baseline: 3.5, actual: 1.8 },
  { day: "Sun", baseline: 3.3, actual: 1.6 },
];

export const occupancy24h = [0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 1, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2].map((count, h) => ({
  hour: `${String(h).padStart(2, "0")}:00`,
  occupants: count,
  watts: count === 0 ? 0 : +(22 + count * 13.2 + ((h * 5) % 9)).toFixed(1),
}));

export const powerLog = [
  { time: "08:02 AM", event: "Exit Detected — Room Vacant", action: "Power Automatically Switched OFF", on: false },
  { time: "09:41 AM", event: "Entry Detected", action: "Power Restored", on: true },
  { time: "10:14 AM", event: "Room Vacant", action: "Power Automatically Switched OFF", on: false },
  { time: "10:25 AM", event: "Entry Detected", action: "Power Restored", on: true },
  { time: "07:42 PM", event: "2 Occupants Detected", action: "Power Held ON", on: true },
  { time: "08:15 PM", event: "48.5 W Active Load", action: "Normal Operation", on: true },
];

export function roomHistory(room: Room) {
  return Array.from({ length: 12 }, (_, i) => ({
    hour: `${(i * 2).toString().padStart(2, "0")}:00`,
    watts: room.power === 0 && i > 9 ? 0 : Math.max(0, Math.round(room.power * (0.4 + Math.abs(Math.sin(i + room.power)) * 0.8))),
  }));
}
