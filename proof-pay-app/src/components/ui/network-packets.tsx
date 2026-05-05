/**
 * Periodic "payment packets" zooming across the viewport — bright glowing
 * dots with a long trailing glow. Each packet is a small dot inside a
 * rotated launcher; the launcher's rotation tilts the path, then the dot
 * itself just animates `translateX` along the (rotated) X axis. The
 * trailing box-shadow rotates with the launcher so the trail always
 * points behind the direction of motion.
 *
 * Six packets staggered on a 6 s loop produce roughly one packet every
 * second — continuous "live" traffic that feels like money moving across
 * the network. Pure CSS, no JS, no extra deps.
 *
 * Hidden on mobile (`hidden md:block`) — six concurrent box-shadow trails
 * tank low-end phone GPUs.
 */

interface Packet {
  angle: number;
  top: string;
  delay: string;
}

// Mix of slight upward / downward tilts at varied vertical positions so
// no two packets overlap on the same line.
const PACKETS: Packet[] = [
  { angle: -7, top: "20vh", delay: "0s" },
  { angle: 5, top: "45vh", delay: "1s" },
  { angle: -4, top: "62vh", delay: "2s" },
  { angle: 8, top: "78vh", delay: "3s" },
  { angle: -10, top: "35vh", delay: "4s" },
  { angle: 3, top: "55vh", delay: "5s" },
];

export function NetworkPackets() {
  return (
    <div aria-hidden className="hidden md:block network-packets">
      {PACKETS.map((p, i) => (
        <div
          key={i}
          className="packet-launcher"
          style={{
            top: p.top,
            transform: `rotate(${p.angle}deg)`,
          }}
        >
          <span className="packet" style={{ animationDelay: p.delay }} />
        </div>
      ))}
    </div>
  );
}
