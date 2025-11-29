# BrewOS Testers Program

> **Help us make BrewOS compatible with more machines!**

We're looking for espresso enthusiasts to help test and validate BrewOS on their machines. Your contribution helps the community and ensures reliable operation for everyone.

---

## 🧪 Machine Status

### ✅ Validated

Fully tested and confirmed working.

| Brand | Model | Boiler Type | Tester | Notes |
|-------|-------|-------------|--------|-------|
| ECM | **Synchronika** | Dual Boiler | Core Team | **Reference machine** |

### 🔷 Same Platform (Expected Compatible)

These machines use the **same PID controller and GICAR board** as the Synchronika. They should work but need validation testing.

| Brand | Model | Boiler Type | Status | Notes |
|-------|-------|-------------|--------|-------|
| ECM | Barista | Single | 🔷 Needs Tester | Same GICAR board |
| ECM | Technika | Heat Exchanger | 🔷 Needs Tester | Same GICAR board |
| ECM | Technika Profi | Heat Exchanger | 🔷 Needs Tester | Same GICAR board |
| ECM | Mechanika | Heat Exchanger | 🔷 Needs Tester | Same GICAR board |
| ECM | Mechanika Profi | Heat Exchanger | 🔷 Needs Tester | Same GICAR board |
| ECM | Mechanika V Slim | Heat Exchanger | 🔷 Needs Tester | Same GICAR board |
| ECM | Controvento | Dual Boiler | 🔷 Needs Tester | Same GICAR board |
| Profitec | Pro 300 | Single | 🔷 Needs Tester | Same GICAR board |
| Profitec | Pro 500 | Heat Exchanger | 🔷 Needs Tester | Same GICAR board |
| Profitec | Pro 700 | Dual Boiler | 🔷 Needs Tester | Same GICAR board |

### 🔲 Other Brands

Different electronics - may require custom wiring.

| Brand | Model | Boiler Type | Status | Notes |
|-------|-------|-------------|--------|-------|
| | | | 🔲 Needs Testing | *Be the first!* |

---

## 🙋 How to Become a Tester

We welcome testers at all skill levels! Here's how you can help:

### Level 1: Documentation Tester
*No hardware required*
- Review documentation for clarity
- Report confusing sections
- Suggest improvements

### Level 2: Compatibility Tester  
*Machine access required*
- Document your machine's wiring
- Photograph internal components
- Identify sensors and relays

### Level 3: Hardware Tester
*Electronics skills required*
- Install BrewOS hardware
- Test functionality
- Report issues and bugs

### Level 4: Validation Tester
*Full integration*
- Long-term daily use testing
- Performance validation
- Feature testing

---

## 📋 Testing Process

### Step 1: Register Interest
Open a [GitHub Issue](https://github.com/YOUR_REPO/issues/new) with:
- Your machine make/model
- Your experience level (1-4)
- What you'd like to help with

### Step 2: Get Hardware
For Level 3-4 testers:
- We can provide PCB assembly instructions
- Component sourcing guidance
- Wiring diagrams for your machine

### Step 3: Install & Test
- Follow installation guide
- Document your process
- Report any differences from expected behavior

### Step 4: Validation
- Run through test procedures
- Submit validation report
- Your machine gets added to the validated list! 🎉

---

## 🎯 Machines We'd Love to Test

We're especially interested in testers for:

### ECM (Other Models)
- Classika
- Puristika
- Casa V
- Rocket variants

### Profitec (Other Models)
- Pro 400
- Pro 600
- Pro 800

### Lelit
- MaraX
- Bianca
- Elizabeth
- Victoria

### Rocket
- Appartamento
- Mozzafiato
- R58
- R Nine One

### Bezzera
- BZ10
- BZ13
- Duo
- Matrix

### Quickmill
- Andreja Premium
- Vetrano 2B

### La Marzocco
- Linea Mini
- GS3

### Other E61 Machines
- Any E61 group head machine

---

## 📝 Validation Report Template

When submitting a validation report, please include:

```markdown
## Machine Validation Report

**Machine:** [Brand] [Model]
**Boiler Type:** Single / Heat Exchanger / Dual Boiler
**Tester:** [Your name/handle]
**Date:** [Date]
**BrewOS Version:** [Version]

### Hardware Configuration
- [ ] Standard PCB
- [ ] Custom wiring (describe)

### Sensors Tested
- [ ] Brew boiler temperature
- [ ] Steam boiler temperature (if applicable)
- [ ] Group head temperature
- [ ] Pressure transducer
- [ ] Water level probes

### Features Tested
- [ ] Heating to setpoint
- [ ] Temperature stability (±0.5°C)
- [ ] Brewing detection
- [ ] Steam detection
- [ ] Water level detection
- [ ] Cleaning mode
- [ ] Statistics tracking

### Notes
[Any observations, differences, or issues]

### Photos
[Attach installation photos if possible]
```

---

## 🏆 Tester Recognition

Contributors who validate machines will be:
- Listed in this document
- Credited in release notes
- Added to the project contributors

---

## ⚠️ Important Notes

1. **Safety First**: Only attempt hardware installation if you're qualified to work with mains electricity
2. **No Warranty**: Testing is at your own risk
3. **Be Patient**: The core team has limited capacity - response times may vary
4. **Document Everything**: Good documentation helps others with the same machine

---

## 📬 Contact

- **GitHub Issues**: Best for tracking
- **Discussions**: For questions and community chat
- **Email**: [Add contact email if applicable]

---

*Thank you for helping make BrewOS better for everyone!* ☕

