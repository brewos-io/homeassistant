/**
 * BrewOS Scale Pairing Screen
 * 
 * BLE scale discovery and connection interface
 */

#ifndef SCREEN_SCALE_H
#define SCREEN_SCALE_H

#include <lvgl.h>
#include "ui.h"

/**
 * Scale screen states
 */
typedef enum {
    SCALE_SCREEN_IDLE,      // Not scanning, showing status or "Start Scan"
    SCALE_SCREEN_SCANNING,  // BLE scan in progress
    SCALE_SCREEN_LIST,      // Showing discovered scales
    SCALE_SCREEN_CONNECTING // Connecting to selected scale
} scale_screen_state_t;

/**
 * Create the scale pairing screen
 */
lv_obj_t* screen_scale_create(void);

/**
 * Update scale screen
 */
void screen_scale_update(const ui_state_t* state);

/**
 * Handle encoder rotation (navigate list)
 */
void screen_scale_encoder(int direction);

/**
 * Handle encoder button press
 * Returns true if handled
 */
bool screen_scale_select(void);

/**
 * Start scanning for scales
 */
void screen_scale_start_scan(void);

/**
 * Stop scanning
 */
void screen_scale_stop_scan(void);

/**
 * Refresh discovered devices list
 */
void screen_scale_refresh_list(void);

/**
 * Get current screen state
 */
scale_screen_state_t screen_scale_get_state(void);

#endif // SCREEN_SCALE_H

