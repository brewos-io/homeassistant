/**
 * BrewOS Idle Screen
 * 
 * Machine off/standby screen showing:
 * - Current power mode (Brew Only / Brew & Steam)
 * - Power on prompt
 * - Mode selection via rotary encoder
 * 
 * Users select what they want to use, not the heating strategy.
 * The heating strategy is auto-determined based on power configuration.
 */

#ifndef SCREEN_IDLE_H
#define SCREEN_IDLE_H

#include <lvgl.h>
#include "ui.h"

/**
 * Create the idle screen
 */
lv_obj_t* screen_idle_create(void);

/**
 * Update idle screen with current state
 */
void screen_idle_update(const ui_state_t* state);

/**
 * Set the selected power mode index (from encoder rotation)
 */
void screen_idle_select_power_mode(int index);

/**
 * Legacy function name - calls screen_idle_select_power_mode
 */
void screen_idle_select_strategy(int index);

/**
 * Get the currently selected power mode
 */
power_mode_t screen_idle_get_selected_power_mode(void);

/**
 * Get the default heating strategy for the selected power mode
 * Note: Actual strategy may be adjusted based on power configuration
 */
heating_strategy_t screen_idle_get_selected_strategy(void);

/**
 * Set whether power mode selection should be shown
 * Power modes only apply to dual boiler machines
 * @param show true to show mode selection, false to hide
 */
void screen_idle_set_show_strategies(bool show);

/**
 * Check if power mode selection is visible
 */
bool screen_idle_is_showing_strategies(void);

/**
 * Callback type for turn on action
 */
typedef void (*idle_turn_on_callback_t)(heating_strategy_t strategy);

/**
 * Set callback for turn on action
 */
void screen_idle_set_turn_on_callback(idle_turn_on_callback_t callback);

#endif // SCREEN_IDLE_H

