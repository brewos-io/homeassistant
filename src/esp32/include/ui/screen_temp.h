/**
 * BrewOS Temperature Settings Screen
 * 
 * Allows adjustment of brew and steam temperature setpoints
 * using the rotary encoder.
 */

#ifndef SCREEN_TEMP_H
#define SCREEN_TEMP_H

#include <lvgl.h>
#include "ui.h"

/**
 * Temperature edit mode
 */
typedef enum {
    TEMP_EDIT_NONE,
    TEMP_EDIT_BREW,
    TEMP_EDIT_STEAM
} temp_edit_mode_t;

/**
 * Create the temperature settings screen
 */
lv_obj_t* screen_temp_create(void);

/**
 * Update temperature screen with current values
 */
void screen_temp_update(const ui_state_t* state);

/**
 * Handle encoder rotation
 * @param direction positive = CW, negative = CCW
 */
void screen_temp_encoder(int direction);

/**
 * Handle encoder button press
 * Returns true if handled (stays on screen), false to exit
 */
bool screen_temp_select(void);

/**
 * Get current edit mode
 */
temp_edit_mode_t screen_temp_get_mode(void);

/**
 * Callback when temperature is changed
 */
typedef void (*temp_change_callback_t)(bool is_steam, float temp);
void screen_temp_set_callback(temp_change_callback_t callback);

#endif // SCREEN_TEMP_H

