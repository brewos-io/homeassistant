# Hardware Specification Changelog

## Revision History

| Rev    | Date     | Description                                                       |
| ------ | -------- | ----------------------------------------------------------------- |
| 2.22   | Dec 2025 | **CURRENT** - Engineering review fixes (thermal, GPIO protection) |
| 2.21.1 | Dec 2025 | Pico 2 compatibility fixes, power supply                          |
| 2.21   | Dec 2025 | External power metering, multi-machine NTC support                |
| 2.20   | Dec 2025 | Unified 22-pos screw terminal (J26)                               |
| 2.19   | Dec 2025 | Removed spare relay K4                                            |
| 2.17   | Nov 2025 | Brew-by-weight support (J15 8-pin)                                |
| 2.16   | Nov 2025 | Production-ready specification                                    |

---

## v2.22 (December 2025)

**Engineering Design Review Fixes - Thermal & GPIO Protection**

This revision addresses critical issues identified in an independent engineering design qualification and reliability analysis of the RP2350-based control system.

### 🔴 Critical Engineering Change Orders (ECOs)

#### 1. Power Regulator: LDO → Synchronous Buck Converter

| Component | Old (v2.21)     | New (v2.22)      | Reason                                                       |
| --------- | --------------- | ---------------- | ------------------------------------------------------------ |
| **U3**    | AP2112K-3.3 LDO | TPS563200DDCR    | LDO thermal risk in hot environment                          |
| **L1**    | (none)          | 2.2µH inductor   | Required for buck topology (2.2µH per TI datasheet for 3.3V) |
| **C3**    | 100µF Alum      | 22µF Ceramic X5R | Buck input cap                                               |
| **C4**    | 47µF Ceramic    | 22µF Ceramic X5R | Buck output cap                                              |
| **C4A**   | (none)          | 22µF Ceramic X5R | Parallel output cap for low ripple                           |

**Problem:** SOT-23-5 LDO dissipates P = (5V - 3.3V) × I = 1.7W × I. At 250mA load in 60°C ambient, junction temperature exceeds 125°C maximum rating, causing thermal shutdown.

**Solution:** Synchronous buck converter at >90% efficiency reduces heat by 10×. Same footprint complexity, vastly improved thermal reliability.

#### 1a. Pico Internal Regulator Disabled (3V3_EN = GND)

| Component | Old (v2.21)                       | New (v2.22)                   | Reason                             |
| --------- | --------------------------------- | ----------------------------- | ---------------------------------- |
| **U1**    | 3V3 = +3.3V (parallel regulators) | 3V3 = +3.3V, **3V3_EN = GND** | Disables Pico's internal regulator |

**Problem:** The Pico 2 has an internal RT6150B buck-boost regulator that outputs 3.3V on Pin 36. Connecting the external TPS563200 output to this pin creates a "hard parallel" condition - two closed-loop regulators fighting for control. This causes feedback contention, potential reverse current damage, and instability.

**Solution:** Connect Pico Pin 37 (3V3_EN) to GND. This disables the internal regulator, allowing the external TPS563200 to safely power the entire 3.3V domain via the Pico's 3V3 pin.

#### 1b. Fusing Hierarchy: Secondary Fuse for HLK Module

| Component | Old (v2.21) | New (v2.22)               | Reason                                        |
| --------- | ----------- | ------------------------- | --------------------------------------------- |
| **F2**    | (none)      | 500mA 250V slow-blow fuse | Protects HLK module independently from relays |

**Problem:** The main 10A fuse (F1) protects relay-switched loads (pump, solenoid). If the HLK-15M05C AC/DC module fails (e.g., shorted primary winding), the 10A fuse may not clear fast enough to prevent PCB damage.

**Solution:** Add F2 (500mA) in series with HLK module input, branching from L_FUSED after F1. This "fusing hierarchy" ensures HLK faults blow only F2, protecting traces and preventing main fuse replacement for logic supply faults.

#### 2. PZEM Interface: 5V→3.3V Level Shifting

| Component | Old (v2.21) | New (v2.22)            | Reason                         |
| --------- | ----------- | ---------------------- | ------------------------------ |
| **R45**   | 33Ω series  | 2.2kΩ (upper divider)  | RP2350 GPIO is NOT 5V tolerant |
| **R45A**  | (none)      | 3.3kΩ (lower divider)  | Creates voltage divider        |
| **R45B**  | (none)      | 33Ω (series after div) | ESD protection after divider   |

**Problem:** PZEM-004T outputs 5V TTL signals. RP2350 internal protection diodes conduct at ~3.6V, stressing silicon and causing long-term GPIO degradation or latch-up.

**Solution:** Resistive divider: V_out = 5V × 3.3k / (2.2k + 3.3k) = 3.0V (safe for 3.3V GPIO).

#### 3. Relay K1 Function Clarification

| Aspect          | Old (v2.21)        | New (v2.22)                    |
| --------------- | ------------------ | ------------------------------ |
| **Description** | "Water LED relay"  | "Mains indicator lamp relay"   |
| **Load Type**   | Ambiguous          | Mains indicator lamp (~100mA)  |
| **Relay**       | APAN3105 (3A slim) | APAN3105 (3A slim) - unchanged |

**Clarification:** K1 switches a mains-powered indicator lamp on the machine front panel (~100mA load). The 3A slim relay (APAN3105) is appropriate for this low-current application. The relay is required because the indicator is mains-level, but the current draw is minimal.

### 🟡 Reliability Enhancements

#### 4. Fast Flyback Diodes

| Component | Old (v2.21) | New (v2.22) | Reason                                   |
| --------- | ----------- | ----------- | ---------------------------------------- |
| **D1-D3** | 1N4007      | UF4007      | Fast recovery (75ns) for snappy contacts |

**Improvement:** Standard 1N4007 has slow reverse recovery, causing relay coil current to decay slowly ("lazy" contact opening). UF4007 fast recovery diode dissipates stored energy faster, resulting in snappier relay contact separation and reduced arcing on mains-side contacts.

#### 5. Precision ADC Voltage Reference

| Component | Old (v2.21)       | New (v2.22)              | Reason                         |
| --------- | ----------------- | ------------------------ | ------------------------------ |
| **U5**    | (none)            | LM4040DIM3-3.0           | Precision 3.0V shunt reference |
| **R7**    | (none)            | 1kΩ 1% (bias)            | Sets reference operating point |
| **C7**    | 22µF on 3.3V_A    | 22µF on ADC_VREF         | Bulk cap for reference         |
| **C7A**   | (none)            | 100nF (HF decoupling)    | Reference noise filtering      |
| **FB1**   | 3.3V → 3.3V_A     | 3.3V → ADC_VREF (via R7) | Isolates reference from noise  |
| **R1,R2** | Pull-up to 3.3V_A | Pull-up to ADC_VREF      | Uses precision reference       |
| **TP2**   | (none)            | ADC_VREF test point      | Calibration verification       |

**Improvement:** Using the 3.3V rail as ADC reference couples regulator thermal drift into temperature measurements. The LM4040 provides a stable 3.0V ±0.5% reference with 100ppm/°C tempco, significantly improving temperature measurement accuracy and stability.

#### 6. Pressure Sensor Divider: Prevent ADC Saturation

| Component | Old (v2.21) | New (v2.22) | Reason                                      |
| --------- | ----------- | ----------- | ------------------------------------------- |
| **R4**    | 4.7kΩ       | 5.6kΩ       | Prevents ADC saturation with 3.0V reference |

**Problem:** With the 3.0V ADC reference (U5), the old 4.7kΩ divider produced V_max = 4.5V × 0.68 = 3.06V, exceeding the 3.0V reference and causing ADC saturation above ~15.6 bar.

**Solution:** Change R4 to 5.6kΩ. New ratio = 0.641, V_max = 2.88V (120mV headroom below reference). Full 0-16 bar range now linear with no clipping.

### 📋 Documentation Additions

#### RP2350 ADC E9 Erratum Documentation

Added comprehensive documentation of the RP2350 A2 stepping ADC leakage current issue (Erratum E9):

- **Issue:** Parasitic leakage on ADC pins (GPIO 26-29) when voltage >2.0V or high-impedance
- **Impact:** Can cause temperature errors >1°C on NTC channels at high temperatures
- **Mitigations documented:** Silicon stepping verification, firmware calibration, future external ADC option
- **Recommendation:** Firmware calibration against reference thermometer required for ±0.5°C accuracy

#### Thermocouple Ground Loop Warning

Added critical documentation about the MAX31855 ground loop trap with grounded junction thermocouples:

- **Problem:** Espresso machine thermocouples are often "grounded junction" - the TC junction is welded to the stainless steel probe sheath. When the sheath is screwed into the boiler (bonded to PE), a ground loop forms through MH1 → PCB GND → MAX31855 GND → T- → boiler.
- **Consequence:** MAX31855 internal T- bias is overridden, causing "Short to GND" fault (D2 bit) or massive common-mode noise on the µV-level thermocouple signal, rendering PID control unstable.
- **🔴 REQUIREMENT:** **UNGROUNDED (INSULATED) thermocouples ONLY**. The junction must be electrically isolated from the sheath by MgO insulation.
- **Diagnostic:** If MAX31855 reports "Short to GND" fault, the thermocouple is likely grounded junction - replace with ungrounded type.
- **Alternative (not recommended):** Galvanic isolation (ISO7741 + isolated DC/DC) adds ~$15 and PCB complexity.

#### 7. Pump Relay: High-Capacity Variant Required

| Component | Old (v2.21)  | New (v2.22)        | Reason                             |
| --------- | ------------ | ------------------ | ---------------------------------- |
| **K2**    | G5LE-1A4 DC5 | G5LE-1A4-**E** DC5 | Standard variant is only 10A rated |

**Problem:** The netlist specified K2 as "G5LE-1A4 DC5" with description "16A pump relay". However, the standard Omron G5LE-1A4 is rated for only **10A** (resistive) and less for inductive loads. The "-E" suffix denotes the high-capacity 16A variant.

**Risk:** Using an undersized relay for the pump's inductive load (with inrush current) can cause contact welding, leading to a "runaway pump" failure mode where the pump runs continuously.

**Solution:** Specify G5LE-1A4**-E** DC5 to ensure 16A contact rating matches the specification.

#### 8. RS485 TVS Surge Protection Added

| Component | Old (v2.21) | New (v2.22) | Reason                          |
| --------- | ----------- | ----------- | ------------------------------- |
| **D21**   | (none)      | SM712       | RS485 A/B line surge protection |

**Problem:** The RS485 interface (MAX3485, J17) extends off-board to external power meters. Industrial environments (kitchens) have severe EMI from motors, heaters, and potential lightning-induced surges on data lines.

**Solution:** Add SM712 asymmetric TVS diode on RS485 A/B lines:

- Clamps to -7V / +12V (matches RS485 common-mode voltage range)
- Protects against motor switching noise and nearby lightning
- Place close to J17 connector

**Existing good practice noted:** R19 (10kΩ pull-down on GPIO20/DE) ensures transceiver defaults to receive mode during boot, preventing bus contention.

#### 9. Level Probe Oscillator Frequency: Electrolysis Prevention

| Component   | Old (v2.21) | New (v2.22) | Reason                                   |
| ----------- | ----------- | ----------- | ---------------------------------------- |
| **C61-C62** | 100nF       | 10nF        | Increases frequency from 160Hz to 1.6kHz |

**Problem:** The Wien bridge oscillator at 160Hz allows significant electrochemical reactions (electrolysis) during each AC half-cycle. Low frequencies give ions time to migrate to the electrode surface and complete Faradaic reactions, corroding the level probe. At 160Hz, probe life may be only months.

**Solution:** Change C61/C62 from 100nF to 10nF:

- f = 1/(2π × 10kΩ × 10nF) ≈ **1.6 kHz**
- Industry standard for conductivity sensors: 1-10 kHz
- At 1.6kHz, probe life extends to **5-10+ years**

**Electrochemistry background:**

- Faradaic reactions require activation energy and time
- Higher frequency = shorter half-periods = less time for electrolysis
- Double-layer capacitance at electrode/water interface is better bypassed at kHz frequencies

### Component Summary (v2.22 Changes)

| Category        | Added               | Changed                                       | Removed |
| --------------- | ------------------- | --------------------------------------------- | ------- |
| **ICs**         | U5 (LM4040DIM3-3.0) | U3 (AP2112K → TPS563200)                      | -       |
| **Inductors**   | L1 (2.2µH)          | -                                             | -       |
| **Resistors**   | R7, R45A, R45B      | R45 (33Ω → 2.2kΩ), R4 (4.7k → 5.6k)           | -       |
| **Capacitors**  | C4A, C7A            | C3, C4, C7, C61-C62 (100nF → 10nF for 1.6kHz) | -       |
| **Diodes**      | D21 (SM712 RS485)   | D1-D3 (1N4007 → UF4007)                       | -       |
| **Relays**      | -                   | K1 clarified, K2 → G5LE-1A4-E (16A)           | -       |
| **Test Points** | TP2 (ADC_VREF)      | -                                             | -       |
| **Fuses**       | F2 (500mA HLK)      | -                                             | -       |
| **Pico Config** | -                   | 3V3_EN = GND (internal reg disabled)          | -       |

### Design Verdict

**Status:** Approved for production (pending verification of changes)

The engineering review identified this design as fundamentally sound with excellent practices in several areas (Wien bridge level sensor, snubber networks). With the implementation of these thermal and logic-level protections, the design is qualified as a high-reliability platform suitable for commercial/prosumer applications.

---

## v2.21 (December 2025)

**Universal External Power Metering & Multi-Machine Support**

### MCU Upgrade: Raspberry Pi Pico 2 (RP2350)

| Change          | Description                                          |
| --------------- | ---------------------------------------------------- |
| **MCU**         | Upgraded from RP2040 to **RP2350** (Pico 2)          |
| **Part Number** | SC0942 (Pico 2) or SC1632 (Pico 2 W with WiFi)       |
| **Performance** | Dual Cortex-M33 @ 150MHz (vs M0+ @ 133MHz)           |
| **Memory**      | 520KB SRAM, 4MB Flash (vs 264KB/2MB)                 |
| **PIO**         | 12 state machines in 3 blocks (vs 8 in 2 blocks)     |
| **ADC**         | 4 channels (vs 3) - extra channel available          |
| **E9 Errata**   | Pull-down resistors on inputs mitigate GPIO latching |

**Note:** Same form factor and pinout - drop-in upgrade from original Pico.

### Power Metering (External Modules)

| Change       | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| **REMOVED**  | Embedded PZEM-004T daughterboard                            |
| **J17 (LV)** | JST-XH 6-pin for UART/RS485 communication                   |
| **J24 (HV)** | Screw terminal 3-pos (L fused, N, PE) for easy meter wiring |
| **U8**       | MAX3485 RS485 transceiver with JP1 termination jumper       |
| **J26**      | Reduced 24→22 pos (CT clamp pins removed)                   |

**Supported meters:** PZEM-004T, JSY-MK-163T/194T, Eastron SDM, and other Modbus meters

### Multi-Machine NTC Support (Jumper Selectable)

| Jumper Config     | Machine Type   | NTC  | Effective R1 | Effective R2 |
| ----------------- | -------------- | ---- | ------------ | ------------ |
| JP2/JP3 **OPEN**  | ECM, Profitec  | 50kΩ | 3.3kΩ        | 1.2kΩ        |
| JP2/JP3 **CLOSE** | Rocket, Gaggia | 10kΩ | ~1kΩ         | ~430Ω        |

**New components:** R1A (1.5kΩ), R2A (680Ω) parallel resistors via solder jumpers

### Expansion & Documentation

- **GPIO22 Expansion:** Available on J15 Pin 8 (SPARE) for future use (flow meter, etc.)
- **J25 REMOVED:** GPIO23 is internal to Pico 2 module (SMPS Power Save) - not on header
- **Section 14.3a:** Solder Jumpers (JP1, JP2, JP3)
- **Section 14.9:** External Sensors BOM with ordering specs
- **Sensor restrictions documented:** Type-K thermocouple only, 0.5-4.5V pressure only
- **C2 upgraded:** 470µF 6.3V Polymer capacitor (low ESR, long life in hot environment)
  - C3 removed - single bulk cap sufficient with HLK internal filtering
- **K1/K3 downsized:** Panasonic APAN3105 (3A, slim 5mm) replaces HF46F (10A)
  - K2 (pump) stays Omron G5LE-1A4 DC5 (16A) for motor inrush
  - Saves ~16mm PCB width
- **Snubbers → MOVs:** Replaced bulky X2 caps (C50-C51) + resistors (R80-R81) with MOVs (RV2-RV3)
  - S10K275 varistors (10mm disc) - ~70% smaller than RC snubbers
  - Critical for slim relay contact protection

### Fixes & Clarifications (v2.21.1)

| Item              | Issue                          | Fix                                                                   |
| ----------------- | ------------------------------ | --------------------------------------------------------------------- |
| **Power Supply**  | HLK-5M05 (1A) insufficient     | Changed to **HLK-15M05C** (3A/15W, 48×28×18mm)                        |
| **GPIO23**        | Not available on Pico 2 header | J25 expansion header **removed** (use GPIO22 via J15 Pin 8)           |
| **3.3V Rail**     | Unclear power architecture     | Clarified: External LDO (U3) for sensors only, Pico has internal 3.3V |
| **Diagram**       | "RELAYS (4x)" incorrect        | Fixed to **"RELAYS (3x)"** (K1, K2, K3)                               |
| **SSR Pins**      | J26 Pin 19-22 referenced       | Fixed: **SSR1=Pin 17-18, SSR2=Pin 19-20**                             |
| **Power Budget**  | Relay current incorrect        | Updated: 80mA typical, 150mA peak (K2:70mA, K1/K3:40mA)               |
| **Total Current** | Old values                     | Updated: **~355mA typical, ~910mA peak** (3A gives 3× headroom)       |

### New Features (v2.21.1)

| Item             | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| **ADC Clamping** | Added **D16 (BAT54S)** Schottky diode to protect pressure ADC from overvoltage |

**ADC Protection:** Prevents RP2350 damage if pressure transducer voltage divider fails.

### Pico 2 GPIO Clarifications

**Internal GPIOs (NOT on Pico 2 40-pin header):**

| GPIO   | Internal Function | Notes                    |
| ------ | ----------------- | ------------------------ |
| GPIO23 | SMPS Power Save   | Cannot use for J25       |
| GPIO24 | VBUS Detect       | USB connection sense     |
| GPIO25 | Onboard LED       | Green LED on module      |
| GPIO29 | VSYS/3 ADC        | Internal voltage monitor |

**Available on header:** GPIO 0-22, 26-28 (26 pins total)

---

## v2.20 (December 2025)

**Unified Low-Voltage Terminal Block**

- **J26 unified screw terminal (22-pos):** ALL low-voltage connections consolidated
- **Includes:** Switches (S1-S4), NTCs (T1-T2), Thermocouple, Pressure, SSRs
- **Eliminates:** J10, J11, J12, J13, J18, J19 (all merged into J26)
- **6.3mm spades retained ONLY for 220V AC:** Mains input and relay outputs

---

## v2.19 (December 2025)

**Simplified Relay Configuration**

- Removed spare relay K4 and associated components
- GPIO20 made available as test point TP1

---

## v2.17 (November 2025)

**Brew-by-Weight Support**

- J15 ESP32 connector expanded from 6-pin to 8-pin JST-XH
- GPIO21: WEIGHT_STOP signal (ESP32 → Pico)
- GPIO22: SPARE for future expansion
- Enables Bluetooth scale integration via ESP32

---

## v2.16 (November 2025)

**Production-Ready Specification**

- Power supply: HLK-15M05C (5V 3A/15W, 48×28×18mm)
- Level probe: OPA342 + TLV3201 AC sensing circuit
- Snubbers: MANDATORY for K2 (Pump) and K3 (Solenoid)
- NTC pull-ups: Optimized for 50kΩ NTCs (R1=3.3kΩ, R2=1.2kΩ)
- Mounting: MH1=PE star point (PTH), MH2-4=NPTH (isolated)
- SSR control: 5V trigger signals only, mains via existing machine wiring
