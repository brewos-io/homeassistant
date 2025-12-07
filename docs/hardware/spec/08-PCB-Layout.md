# PCB Design Requirements

## Board Specifications

| Parameter       | Specification                      |
| --------------- | ---------------------------------- |
| Dimensions      | **80mm × 80mm** (target)           |
| Layers          | 2 (Top + Bottom)                   |
| Material        | FR-4 TG130 or higher               |
| Thickness       | 1.6mm ±10%                         |
| Copper Weight   | 2oz (70µm) both layers             |
| Min Trace/Space | 0.2mm / 0.2mm (8mil/8mil)          |
| Min Drill       | 0.3mm                              |
| Surface Finish  | ENIG (preferred) or HASL Lead-Free |
| Solder Mask     | Green (both sides)                 |
| Silkscreen      | White (both sides)                 |
| IPC Class       | Class 2 minimum                    |

---

## Connector Placement Strategy

### Design Goal: Single-Edge Connector Access

**Rationale:** The enclosure opens only from the bottom to prevent water ingress from steam/spills. All external connections must be accessible from this single opening.

### Connector Edge Priority

| Priority          | Edge          | Connectors                                        | Notes                        |
| ----------------- | ------------- | ------------------------------------------------- | ---------------------------- |
| **1 (Required)**  | BOTTOM        | All HV spades (J1-J4), Screw terminals (J24, J26) | Mandatory - mains wiring     |
| **2 (Preferred)** | BOTTOM        | J15 (ESP32), J17 (Power meter)                    | Keep with HV if space allows |
| **3 (Fallback)**  | LEFT or RIGHT | J15, J17 if bottom is full                        | Maximum 2 edges total        |

### ⚠️ Constraint: Maximum 2 Accessible Edges

If all connectors cannot fit on the bottom edge:

- **Bottom edge:** All HV connectors (J1-J4, J24) + J26 (sensor screw terminal)
- **One side edge:** LV JST connectors (J15, J17)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  COMPONENTS                         │
│                  (top side)                         │
│                                                     │
│  ┌─────┐                                           │
├──┤ J15 │  ← LV connectors on LEFT edge (fallback)  │
│  ├─────┤                                           │
│  │ J17 │                                           │
│  └─────┘                                           │
│                                                     │
└─────────────────────────────────────────────────────┘
  ║    ║    ║    ║         ║              ║
 J1   J2   J3   J4       J24            J26
 L/N  LED  PUMP SOL    METER HV      SENSORS
      ↑                    ↑              ↑
      └────────────────────┴──────────────┘
              BOTTOM EDGE (PRIMARY)
              Enclosure opening here
```

### Ideal Layout (All on Bottom)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           COMPONENTS (top side)                             │
│                                                                             │
│   ┌─────────┐  ┌────────┐  ┌─────────────────────────────────────────────┐ │
│   │  HLK    │  │  PICO  │  │            ANALOG + DIGITAL                 │ │
│   │ 15M05C  │  │   2    │  │                                             │ │
│   └─────────┘  └────────┘  └─────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
  ║   ║   ║   ║   ║       ║         ║                    ║          ║
 J1  J2  J3  J4  J24     J26       J15                  J17        J16
 L/N LED PMP SOL MTR-HV SENSORS   ESP32              METER-LV    DEBUG
 ↑_____↑___↑___↑___↑______↑________↑___________________↑___________↑
                    ALL CONNECTORS ON BOTTOM EDGE
```

## Mounting Holes

| Hole | Size       | Type | Location | Notes                |
| ---- | ---------- | ---- | -------- | -------------------- |
| MH1  | M3 (3.2mm) | PTH  | Corner   | PE star ground point |
| MH2  | M3 (3.2mm) | NPTH | Corner   | Isolated             |
| MH3  | M3 (3.2mm) | NPTH | Corner   | Isolated             |
| MH4  | M3 (3.2mm) | NPTH | Corner   | Isolated             |

Position all mounting holes 5mm from board edges.

---

## Trace Width Requirements

### High-Voltage Section (220V AC)

| Current      | Min Trace Width | Notes              |
| ------------ | --------------- | ------------------ |
| 16A (pump)   | 5mm             | K2 relay path      |
| 5A (general) | 2mm             | K1, K3 relay paths |
| Mains L/N    | 3mm             | Input traces       |

### Low-Voltage Section

| Signal Type  | Trace Width | Notes               |
| ------------ | ----------- | ------------------- |
| 5V power     | 1.0mm       | Main distribution   |
| 3.3V power   | 0.5mm       | Logic supply        |
| GPIO signals | 0.25mm      | Digital I/O         |
| ADC signals  | 0.3mm       | Guarded, short runs |

---

## Layer Stackup (2-Layer)

```
┌─────────────────────────────────────────┐
│  TOP COPPER (2oz)                       │
│  - Signal routing                       │
│  - Component pads                       │
│  - HV traces (wide, isolated)           │
├─────────────────────────────────────────┤
│  FR-4 CORE (1.6mm)                      │
│  TG130 minimum                          │
├─────────────────────────────────────────┤
│  BOTTOM COPPER (2oz)                    │
│  - Ground plane (LV section)            │
│  - Power distribution                   │
│  - Return paths                         │
└─────────────────────────────────────────┘
```

---

## PCB Layout Zones (80×80mm Target)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PCB LAYOUT ZONES (80×80mm)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    TOP EDGE (no connectors - sealed)                                            │
│    ════════════════════════════════════════════════════════════════════════    │
│    │                                                                        │   │
│    │  ┌────────────────┐ ║ ┌──────────────────────────────────────────┐   │   │
│    │  │  HV SECTION    │ ║ │           LV SECTION                     │   │   │
│    │  │                │ ║ │                                          │   │   │
│    │  │  • HLK-15M05C  │ ║ │  ┌─────────────────┐  ┌──────────────┐  │   │   │
│    │  │  • F1, F2      │ ║ │  │    PICO 2       │  │   ANALOG     │  │   │   │
│    │  │  • RV1 (MOV)   │ ║ │  │    (U1)         │  │  U5,U6,U7,U9 │  │   │   │
│    │  │  • K1,K2,K3    │ ║ │  └─────────────────┘  └──────────────┘  │   │   │
│    │  │  • RV2,RV3     │ ║ │                                          │   │   │
│    │  │                │ ║ │  ┌─────────────────────────────────────┐ │   │   │
│    │  │  (compact)     │ ║ │  │  DRIVERS: Q1-Q5, LEDs, Buck (U3)   │ │   │   │
│    │  └────────────────┘ ║ │  └─────────────────────────────────────┘ │   │   │
│    │                     ║ │                                          │   │   │
│    │    6mm ISOLATION    ║ └──────────────────────────────────────────┘   │   │
│    │        SLOT         ║                                                │   │
│    ════════════════════════════════════════════════════════════════════════    │
│    BOTTOM EDGE - ALL CONNECTORS (enclosure opening)                             │
│    ┌───┬───┬───┬───┬─────┬──────────────────┬────────┬────────┬──────┐         │
│    │J1 │J2 │J3 │J4 │ J24 │       J26        │  J15   │  J17   │ J16  │         │
│    │L/N│LED│PMP│SOL│MTR  │    SENSORS       │ ESP32  │ METER  │DEBUG │         │
│    │   │   │   │   │ HV  │    (18-pos)      │(8-pin) │(6-pin) │(4pin)│         │
│    └───┴───┴───┴───┴─────┴──────────────────┴────────┴────────┴──────┘         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Space Optimization for 80×80mm

| Strategy                   | Implementation                                  |
| -------------------------- | ----------------------------------------------- |
| **Vertical HLK placement** | Stand HLK-15M05C upright if needed (48×28×18mm) |
| **Relay clustering**       | K1, K3 (slim 5mm) flanking K2 (standard)        |
| **Pico orientation**       | Long axis parallel to isolation slot            |
| **Bottom-edge connectors** | All connectors aligned, vertical entry          |
| **Component density**      | 0603/0805 passives, tight but DFM-compliant     |

### Fallback: 2-Edge Layout (if 80mm too tight)

If bottom edge cannot accommodate all connectors:

```
         80mm
    ┌────────────┐
    │            │
    │ COMPONENTS │  80mm
J15─┤            │
J17─┤            │
    │            │
    └────────────┘
     J1 J2 J3 J4 J24 J26
     ════════════════════
     BOTTOM (HV + Sensors)
```

**Rule:** HV connectors (J1-J4, J24) MUST be on bottom edge. LV connectors (J15, J17) may move to left edge if required.

---

## Creepage and Clearance

### IEC 60950-1 / IEC 62368-1 Requirements

| Boundary              | Isolation  | Creepage  | Clearance |
| --------------------- | ---------- | --------- | --------- |
| Mains → LV (5V)       | Reinforced | **6.0mm** | **4.0mm** |
| Relay coil → contacts | Basic      | 3.0mm     | 2.5mm     |
| Phase → Neutral       | Functional | 2.5mm     | 2.5mm     |

### Implementation

- **Routed slot** between HV and LV sections (minimum 2mm wide)
- **No copper pour** in isolation zone
- **Conformal coating** recommended for production

---

## Critical Layout Notes

### Analog Section (High Priority)

1. **ADC traces**: Keep short, route away from switching noise
2. **Ground plane**: Solid under analog section, connect at single point
3. **Ferrite bead** (FB1): Place between digital and analog 3.3V
4. **Reference capacitors** (C7, C7A): Place directly at U9 output
5. **NTC filter caps** (C8, C9): Place close to ADC pins

### Power Section

1. **Buck converter**: Tight layout, short SW trace
2. **Input/output caps**: Adjacent to TPS563200
3. **Inductor**: Keep away from sensitive analog

### High-Voltage Section

1. **Wide traces**: ≥5mm for 16A pump path
2. **Thermal relief**: On relay pads for easier soldering
3. **MOV placement**: Close to relay terminals
4. **Slot isolation**: 6mm minimum to LV section

### EMI Considerations

1. **Keep HV traces short** and away from board edges
2. **Ground pour** around sensitive signals
3. **Guard traces** around ADC inputs
4. **Decoupling caps** at every IC VCC pin

---

## Grounding Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GROUNDING HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              PE (Chassis Ground)                                │
│                                    │                                            │
│                              ┌─────┴─────┐                                      │
│                              │    MH1    │  ← PE Star Point (PTH mounting hole) │
│                              │  (PTH)    │                                      │
│                              └─────┬─────┘                                      │
│                                    │                                            │
│                    ┌───────────────┴───────────────┐                            │
│                    │                               │                            │
│              ┌─────┴─────┐                   ┌─────┴─────┐                      │
│              │  HV GND   │                   │  LV GND   │                      │
│              │  (Mains)  │                   │  (Logic)  │                      │
│              └─────┬─────┘                   └─────┬─────┘                      │
│                    │                               │                            │
│                 Isolated                    ┌──────┴──────┐                     │
│              via HLK module                 │             │                     │
│                                       ┌─────┴────┐  ┌─────┴────┐               │
│                                       │ DGND     │  │ AGND     │               │
│                                       │ (Digital)│  │ (Analog) │               │
│                                       └──────────┘  └──────────┘               │
│                                                                                  │
│    KEY RULES:                                                                   │
│    ──────────                                                                   │
│    1. Single connection point between PE and LV GND (at MH1)                   │
│    2. HV GND isolated from LV GND via HLK module                               │
│    3. AGND and DGND connect at single point near Pico ADC_GND                  │
│    4. No ground loops - star topology only                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Silkscreen Requirements

### Mandatory Markings

- Board name and version
- Safety warnings near HV section ("⚠️ HIGH VOLTAGE")
- Pin 1 indicators on all connectors
- Polarity markings (diodes, caps, LEDs)
- Jumper configuration labels (JP1-JP4)
- Test point labels (TP1-TP3)
- Component references

### Recommended

- QR code linking to documentation
- Manufacturer logo/branding
- Date code placeholder

---

## Enclosure Integration

### Design Constraints

| Requirement             | Rationale                                         |
| ----------------------- | ------------------------------------------------- |
| **Bottom-only opening** | Prevents water/steam ingress from above           |
| **Single-edge wiring**  | Simplifies installation, reduces cable management |
| **Compact form factor** | Fits in existing machine control cavity           |
| **Vertical clearance**  | Account for HLK module height (18mm) + connectors |

### Enclosure Dimensions (Target)

```
┌─────────────────────────────────────────┐
│                                         │
│        ┌─────────────────────┐         │
│        │                     │         │
│        │    PCB (80×80mm)    │  ~25mm  │
│        │                     │  height │
│        └─────────────────────┘         │
│                                         │
│   ═══════════════════════════════════  │  ← Bottom opening
│   Connectors accessible from below     │
│                                         │
└─────────────────────────────────────────┘
         ~90mm × 90mm × 35mm
         (external dimensions)
```

### Water Protection (IP Rating Target)

| Area        | Protection                   |
| ----------- | ---------------------------- |
| Top, sides  | Sealed (IP44 minimum)        |
| Bottom      | Open for wiring access       |
| Cable entry | Gland or grommet recommended |

**Note:** Conformal coating on PCB provides additional moisture protection.
