/**
 * BrewOS Home Screen Implementation
 * 
 * Beautiful minimal design with:
 * - Large temperature arc as main visual
 * - Clean floating temperature and pressure values
 * - Subtle connection status
 * 
 * Optimized for 480x480 round display
 */

#include "platform/platform.h"
#include "ui/screen_home.h"
#include "display/theme.h"
#include "display/display_config.h"

// Static elements
static lv_obj_t* screen = nullptr;
static lv_obj_t* brew_temp_label = nullptr;
static lv_obj_t* brew_temp_arc = nullptr;
static lv_obj_t* brew_setpoint_label = nullptr;
static lv_obj_t* brew_label_text = nullptr;
static lv_obj_t* steam_temp_label = nullptr;
static lv_obj_t* steam_label = nullptr;
static lv_obj_t* pressure_label = nullptr;
static lv_obj_t* pressure_unit_label = nullptr;
static lv_obj_t* status_label = nullptr;
static lv_obj_t* status_dot = nullptr;
static lv_obj_t* wifi_icon = nullptr;
static lv_obj_t* scale_icon = nullptr;
static lv_obj_t* cloud_icon = nullptr;

// Cached machine type for dynamic updates
static uint8_t cached_machine_type = 0;

// =============================================================================
// Screen Creation
// =============================================================================

lv_obj_t* screen_home_create(void) {
    LOG_I("Creating home screen...");
    
    // Create screen with dark background
    screen = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(screen, COLOR_BG_DARK, 0);
    
    // Create main container
    lv_obj_t* container = lv_obj_create(screen);
    lv_obj_remove_style_all(container);
    lv_obj_set_size(container, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    lv_obj_center(container);
    lv_obj_clear_flag(container, LV_OBJ_FLAG_SCROLLABLE);
    
    // === Main temperature arc (at the edge of display) ===
    brew_temp_arc = lv_arc_create(container);
    lv_obj_set_size(brew_temp_arc, 460, 460);
    lv_obj_center(brew_temp_arc);
    lv_arc_set_range(brew_temp_arc, 0, 100);
    lv_arc_set_value(brew_temp_arc, 0);
    lv_arc_set_bg_angles(brew_temp_arc, 135, 45);  // Open at bottom
    lv_arc_set_rotation(brew_temp_arc, 0);
    
    // Arc background - subtle
    lv_obj_set_style_arc_color(brew_temp_arc, COLOR_BG_ELEVATED, LV_PART_MAIN);
    lv_obj_set_style_arc_width(brew_temp_arc, 10, LV_PART_MAIN);
    
    // Arc indicator - prominent with rounded ends
    lv_obj_set_style_arc_color(brew_temp_arc, COLOR_ACCENT_PRIMARY, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(brew_temp_arc, 10, LV_PART_INDICATOR);
    lv_obj_set_style_arc_rounded(brew_temp_arc, true, LV_PART_INDICATOR);
    
    // Hide knob
    lv_obj_set_style_bg_opa(brew_temp_arc, LV_OPA_TRANSP, LV_PART_KNOB);
    lv_obj_clear_flag(brew_temp_arc, LV_OBJ_FLAG_CLICKABLE);
    
    // === Status at top (centered with dot) ===
    lv_obj_t* status_row = lv_obj_create(container);
    lv_obj_remove_style_all(status_row);
    lv_obj_set_size(status_row, 160, 24);
    lv_obj_align(status_row, LV_ALIGN_TOP_MID, 0, 60);
    lv_obj_set_flex_flow(status_row, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(status_row, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    
    status_dot = lv_obj_create(status_row);
    lv_obj_set_size(status_dot, 10, 10);
    lv_obj_set_style_radius(status_dot, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_bg_color(status_dot, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_border_width(status_dot, 0, 0);
    
    status_label = lv_label_create(status_row);
    lv_label_set_text(status_label, "--");
    lv_obj_set_style_text_font(status_label, FONT_NORMAL, 0);
    lv_obj_set_style_text_color(status_label, COLOR_TEXT_PRIMARY, 0);
    lv_obj_set_style_pad_left(status_label, 8, 0);
    
    // === Main Brew Temperature (large, centered) ===
    brew_temp_label = lv_label_create(container);
    lv_label_set_text(brew_temp_label, "--°");
    lv_obj_set_style_text_font(brew_temp_label, FONT_TEMP, 0);
    lv_obj_set_style_text_color(brew_temp_label, COLOR_TEXT_PRIMARY, 0);
    lv_obj_align(brew_temp_label, LV_ALIGN_CENTER, 0, -25);
    
    // Brew label
    brew_label_text = lv_label_create(container);
    lv_label_set_text(brew_label_text, "BREW");
    lv_obj_set_style_text_font(brew_label_text, FONT_SMALL, 0);
    lv_obj_set_style_text_color(brew_label_text, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_text_letter_space(brew_label_text, 3, 0);
    lv_obj_align(brew_label_text, LV_ALIGN_CENTER, 0, 15);
    
    // Setpoint (smaller, below label)
    brew_setpoint_label = lv_label_create(container);
    lv_label_set_text(brew_setpoint_label, "→ --°C");
    lv_obj_set_style_text_font(brew_setpoint_label, FONT_SMALL, 0);
    lv_obj_set_style_text_color(brew_setpoint_label, COLOR_ACCENT_AMBER, 0);
    lv_obj_align(brew_setpoint_label, LV_ALIGN_CENTER, 0, 35);
    
    // === Bottom info row (steam temp and pressure - no boxes) ===
    // Steam temperature (left side)
    steam_label = lv_label_create(container);
    lv_label_set_text(steam_label, "STEAM");
    lv_obj_set_style_text_font(steam_label, FONT_SMALL, 0);
    lv_obj_set_style_text_color(steam_label, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_text_letter_space(steam_label, 2, 0);
    lv_obj_align(steam_label, LV_ALIGN_CENTER, -80, 85);
    
    steam_temp_label = lv_label_create(container);
    lv_label_set_text(steam_temp_label, "--°");
    lv_obj_set_style_text_font(steam_temp_label, FONT_LARGE, 0);
    lv_obj_set_style_text_color(steam_temp_label, COLOR_TEXT_SECONDARY, 0);
    lv_obj_align(steam_temp_label, LV_ALIGN_CENTER, -80, 110);
    
    // Pressure (right side)
    lv_obj_t* pressure_title = lv_label_create(container);
    lv_label_set_text(pressure_title, "PRESSURE");
    lv_obj_set_style_text_font(pressure_title, FONT_SMALL, 0);
    lv_obj_set_style_text_color(pressure_title, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_text_letter_space(pressure_title, 2, 0);
    lv_obj_align(pressure_title, LV_ALIGN_CENTER, 80, 85);
    
    pressure_label = lv_label_create(container);
    lv_label_set_text(pressure_label, "--");
    lv_obj_set_style_text_font(pressure_label, FONT_LARGE, 0);
    lv_obj_set_style_text_color(pressure_label, COLOR_TEXT_SECONDARY, 0);
    lv_obj_align(pressure_label, LV_ALIGN_CENTER, 70, 110);
    
    pressure_unit_label = lv_label_create(container);
    lv_label_set_text(pressure_unit_label, "bar");
    lv_obj_set_style_text_font(pressure_unit_label, FONT_SMALL, 0);
    lv_obj_set_style_text_color(pressure_unit_label, COLOR_TEXT_MUTED, 0);
    lv_obj_align(pressure_unit_label, LV_ALIGN_CENTER, 105, 114);
    
    // === Connection icons (bottom center) ===
    lv_obj_t* conn_row = lv_obj_create(container);
    lv_obj_remove_style_all(conn_row);
    lv_obj_set_size(conn_row, 100, 20);
    lv_obj_align(conn_row, LV_ALIGN_BOTTOM_MID, 0, -60);
    lv_obj_set_flex_flow(conn_row, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(conn_row, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    
    // WiFi
    wifi_icon = lv_label_create(conn_row);
    lv_label_set_text(wifi_icon, LV_SYMBOL_WIFI);
    lv_obj_set_style_text_font(wifi_icon, FONT_SMALL, 0);
    lv_obj_set_style_text_color(wifi_icon, COLOR_SUCCESS, 0);
    lv_obj_set_style_pad_right(wifi_icon, 12, 0);
    
    // Scale (Bluetooth)
    scale_icon = lv_label_create(conn_row);
    lv_label_set_text(scale_icon, LV_SYMBOL_BLUETOOTH);
    lv_obj_set_style_text_font(scale_icon, FONT_SMALL, 0);
    lv_obj_set_style_text_color(scale_icon, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_pad_right(scale_icon, 12, 0);
    
    // Cloud
    cloud_icon = lv_label_create(conn_row);
    lv_label_set_text(cloud_icon, LV_SYMBOL_CLOUD);
    lv_obj_set_style_text_font(cloud_icon, FONT_SMALL, 0);
    lv_obj_set_style_text_color(cloud_icon, COLOR_TEXT_MUTED, 0);
    
    LOG_I("Home screen created");
    return screen;
}

// =============================================================================
// Screen Update
// =============================================================================

void screen_home_update(lv_obj_t* scr, const ui_state_t* state) {
    if (!state || !screen) return;
    
    // Update labels if machine type changed
    // machine_type: 0=unknown, 1=dual_boiler, 2=single_boiler, 3=heat_exchanger
    if (cached_machine_type != state->machine_type) {
        cached_machine_type = state->machine_type;
        
        // Update main temperature label based on machine type
        if (state->machine_type == 2) {  // Single boiler
            lv_label_set_text(brew_label_text, "BOILER");
            // Hide steam for single boiler
            lv_obj_add_flag(steam_label, LV_OBJ_FLAG_HIDDEN);
            lv_obj_add_flag(steam_temp_label, LV_OBJ_FLAG_HIDDEN);
        } else if (state->machine_type == 3) {  // Heat exchanger
            lv_label_set_text(brew_label_text, "GROUP");
            lv_obj_clear_flag(steam_label, LV_OBJ_FLAG_HIDDEN);
            lv_obj_clear_flag(steam_temp_label, LV_OBJ_FLAG_HIDDEN);
            lv_label_set_text(steam_label, "BOILER");
        } else {  // Dual boiler or unknown
            lv_label_set_text(brew_label_text, "BREW");
            lv_obj_clear_flag(steam_label, LV_OBJ_FLAG_HIDDEN);
            lv_obj_clear_flag(steam_temp_label, LV_OBJ_FLAG_HIDDEN);
            lv_label_set_text(steam_label, "STEAM");
        }
    }
    
    // Update main temperature display based on machine type
    char temp_str[16];
    float main_temp = state->brew_temp;
    float main_setpoint = state->brew_setpoint;
    
    // For HX machines, main display shows group temp
    if (state->machine_type == 3) {
        main_temp = state->group_temp;
        main_setpoint = 93.0f;  // Typical group target
    }
    
    snprintf(temp_str, sizeof(temp_str), "%.1f°", main_temp);
    lv_label_set_text(brew_temp_label, temp_str);
    
    // Update setpoint
    snprintf(temp_str, sizeof(temp_str), "→ %.0f°C", main_setpoint);
    lv_label_set_text(brew_setpoint_label, temp_str);
    
    // Update brew arc (percentage of setpoint)
    if (main_setpoint > 0) {
        int pct = (int)((main_temp / main_setpoint) * 100);
        pct = LV_CLAMP(0, pct, 100);
        lv_arc_set_value(brew_temp_arc, pct);
        
        // Update arc color based on temperature state
        lv_color_t temp_color = theme_get_temp_color(main_temp, main_setpoint);
        lv_obj_set_style_arc_color(brew_temp_arc, temp_color, LV_PART_INDICATOR);
    }
    
    // Update secondary temperature (steam)
    if (state->machine_type != 2) {  // Not single boiler
        snprintf(temp_str, sizeof(temp_str), "%.0f°", state->steam_temp);
        lv_label_set_text(steam_temp_label, temp_str);
    }
    
    // Update pressure
    snprintf(temp_str, sizeof(temp_str), "%.1f", state->pressure);
    lv_label_set_text(pressure_label, temp_str);
    
    // Pressure color
    lv_color_t pressure_color = theme_get_pressure_color(state->pressure);
    lv_obj_set_style_text_color(pressure_label, pressure_color, 0);
    
    // Update status
    const char* status_text = "READY";
    lv_color_t status_color = COLOR_SUCCESS;
    
    if (state->alarm_active) {
        status_text = "ALARM";
        status_color = COLOR_ERROR;
    } else if (state->water_low) {
        status_text = "LOW WATER";
        status_color = COLOR_WARNING;
    } else if (state->is_brewing) {
        status_text = "BREWING";
        status_color = COLOR_ACCENT_ORANGE;
    } else if (state->is_heating) {
        status_text = "HEATING";
        status_color = COLOR_WARNING;
    } else if (!state->pico_connected) {
        status_text = "OFFLINE";
        status_color = COLOR_ERROR;
    } else if (state->machine_state == UI_STATE_IDLE) {
        status_text = "OFF";
        status_color = COLOR_TEXT_MUTED;
    }
    
    lv_label_set_text(status_label, status_text);
    lv_obj_set_style_bg_color(status_dot, status_color, 0);
    
    // Update connection icons
    if (wifi_icon) {
        lv_obj_set_style_text_color(wifi_icon, 
            state->wifi_connected ? COLOR_SUCCESS : COLOR_TEXT_MUTED, 0);
    }
    if (scale_icon) {
        lv_obj_set_style_text_color(scale_icon,
            state->scale_connected ? COLOR_INFO : COLOR_TEXT_MUTED, 0);
    }
    if (cloud_icon) {
        lv_obj_set_style_text_color(cloud_icon,
            state->cloud_connected ? COLOR_SUCCESS : COLOR_TEXT_MUTED, 0);
    }
}

