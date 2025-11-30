#ifndef STATE_H
#define STATE_H

#include <stdint.h>
#include <stdbool.h>
#include "protocol_defs.h"

// Undefine macros from protocol_defs.h to avoid conflict with enum
#undef STATE_INIT
#undef STATE_IDLE
#undef STATE_HEATING
#undef STATE_READY
#undef STATE_BREWING
#undef STATE_FAULT
#undef STATE_SAFE
#undef STATE_ECO

// -----------------------------------------------------------------------------
// Machine States
// -----------------------------------------------------------------------------
typedef enum {
    STATE_INIT = 0,         // Initializing
    STATE_IDLE,             // Machine on but not heating (MODE_IDLE)
    STATE_HEATING,          // Actively heating to setpoint
    STATE_READY,            // At temperature, ready to brew
    STATE_BREWING,          // Brewing in progress
    STATE_FAULT,            // Fault condition
    STATE_SAFE,             // Safe state (all outputs off)
    STATE_ECO               // Eco mode (reduced temperature, waiting for wake)
} machine_state_t;

// -----------------------------------------------------------------------------
// Mode
// -----------------------------------------------------------------------------
typedef enum {
    MODE_IDLE = 0,          // Machine on but not heating (idle)
    MODE_BREW,              // Brew mode: heats brew boiler (for espresso)
    MODE_STEAM,             // Steam mode: heats both boilers (steam for milk, brew for espresso)
                            // Hot water comes from steam boiler (no separate mode needed)
    MODE_ECO                // Eco mode: reduced temperature to save power
} machine_mode_t;

// -----------------------------------------------------------------------------
// State Machine Functions
// -----------------------------------------------------------------------------

// Initialize state machine
void state_init(void);

// Update state machine (call in main loop)
void state_update(void);

// Get current state
machine_state_t state_get(void);

// Get current mode
machine_mode_t state_get_mode(void);

// Set mode (request)
bool state_set_mode(machine_mode_t mode);

// Brew control
bool state_start_brew(void);
bool state_stop_brew(void);
bool state_is_brewing(void);

// State queries
bool state_is_ready(void);
bool state_is_heating(void);
bool state_is_fault(void);

// Get state name (for debugging)
const char* state_get_name(machine_state_t state);

// Pre-infusion control
void state_set_preinfusion(bool enabled, uint16_t on_ms, uint16_t pause_ms);
void state_get_preinfusion(bool* enabled, uint16_t* on_ms, uint16_t* pause_ms);

// Brew timer
uint32_t state_get_brew_duration_ms(void);  // Deprecated: use state_get_brew_start_timestamp_ms()
uint32_t state_get_brew_start_timestamp_ms(void);  // Returns brew start timestamp (0 if not brewing)

// -----------------------------------------------------------------------------
// Eco Mode
// -----------------------------------------------------------------------------

// Eco mode configuration
typedef struct {
    bool enabled;                   // Whether eco mode is enabled
    int16_t eco_brew_temp;          // Reduced brew temp in eco mode (Celsius * 10)
    uint16_t timeout_minutes;       // Minutes of idle before entering eco mode (0=disabled)
} eco_config_t;

// Set eco mode configuration
void state_set_eco_config(const eco_config_t* config);

// Get eco mode configuration
void state_get_eco_config(eco_config_t* config);

// Check if currently in eco mode
bool state_is_eco_mode(void);

// Manually enter/exit eco mode
bool state_enter_eco(void);
bool state_exit_eco(void);

// Reset idle timer (call on user activity)
void state_reset_idle_timer(void);

#endif // STATE_H

