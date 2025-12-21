/**
 * BrewOS Idle Screen Implementation
 * 
 * Beautiful power on screen with:
 * - Connection status indicators (WiFi, Bluetooth, Cloud)
 * - Large centered power mode display
 * - Subtle press to start hint
 * 
 * Optimized for 480x480 round display
 */

#include "platform/platform.h"
#include "ui/screen_idle.h"
#include "display/theme.h"
#include "display/display_config.h"

// Power mode names (user-facing)
static const char* power_mode_names[] = {
    "Brew Only",       // POWER_MODE_BREW_ONLY
    "Brew & Steam"     // POWER_MODE_BREW_STEAM
};

static const char* power_mode_descriptions[] = {
    "Espresso without steam",
    "Espresso + milk drinks"
};

// Map power mode to default heating strategy
static const uint8_t power_mode_default_strategy[] = {
    0,  // POWER_MODE_BREW_ONLY -> HEAT_BREW_ONLY
    2   // POWER_MODE_BREW_STEAM -> HEAT_PARALLEL
};

#define POWER_MODE_COUNT 2

// Static elements
static lv_obj_t* screen = nullptr;
static lv_obj_t* power_icon = nullptr;
static lv_obj_t* mode_name_label = nullptr;
static lv_obj_t* mode_desc_label = nullptr;
static lv_obj_t* hint_label = nullptr;
static lv_obj_t* dots_container = nullptr;
static lv_obj_t* mode_dots[POWER_MODE_COUNT] = {nullptr};

// Connection status indicators
static lv_obj_t* status_container = nullptr;
static lv_obj_t* wifi_icon = nullptr;
static lv_obj_t* bt_icon = nullptr;
static lv_obj_t* cloud_icon = nullptr;

// State
static int selected_index = 0;
static idle_turn_on_callback_t turn_on_callback = nullptr;
static bool show_power_modes = true;

// Cached connection state
static bool cached_wifi_connected = false;
static bool cached_scale_connected = false;
static bool cached_cloud_connected = false;

// =============================================================================
// Helper Functions  
// =============================================================================

static void update_connection_indicators() {
    if (wifi_icon) {
        lv_obj_set_style_text_color(wifi_icon, 
            cached_wifi_connected ? COLOR_SUCCESS : COLOR_TEXT_MUTED, 0);
    }
    if (bt_icon) {
        lv_obj_set_style_text_color(bt_icon,
            cached_scale_connected ? COLOR_INFO : COLOR_TEXT_MUTED, 0);
    }
    if (cloud_icon) {
        lv_obj_set_style_text_color(cloud_icon,
            cached_cloud_connected ? COLOR_SUCCESS : COLOR_TEXT_MUTED, 0);
    }
}

// =============================================================================
// Screen Creation
// =============================================================================

lv_obj_t* screen_idle_create(void) {
    LOG_I("Creating idle screen...");
    
    // Create screen with dark background
    screen = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(screen, COLOR_BG_DARK, 0);
    
    // Create main container
    lv_obj_t* container = lv_obj_create(screen);
    lv_obj_remove_style_all(container);
    lv_obj_set_size(container, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    lv_obj_center(container);
    lv_obj_clear_flag(container, LV_OBJ_FLAG_SCROLLABLE);
    
    // === Connection status indicators at top ===
    status_container = lv_obj_create(container);
    lv_obj_remove_style_all(status_container);
    lv_obj_set_size(status_container, 120, 24);
    lv_obj_align(status_container, LV_ALIGN_TOP_MID, 0, 55);
    lv_obj_set_flex_flow(status_container, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(status_container, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    
    // WiFi icon
    wifi_icon = lv_label_create(status_container);
    lv_label_set_text(wifi_icon, LV_SYMBOL_WIFI);
    lv_obj_set_style_text_font(wifi_icon, FONT_NORMAL, 0);
    lv_obj_set_style_text_color(wifi_icon, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_pad_right(wifi_icon, 16, 0);
    
    // Bluetooth icon
    bt_icon = lv_label_create(status_container);
    lv_label_set_text(bt_icon, LV_SYMBOL_BLUETOOTH);
    lv_obj_set_style_text_font(bt_icon, FONT_NORMAL, 0);
    lv_obj_set_style_text_color(bt_icon, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_pad_right(bt_icon, 16, 0);
    
    // Cloud icon
    cloud_icon = lv_label_create(status_container);
    lv_label_set_text(cloud_icon, LV_SYMBOL_CLOUD);
    lv_obj_set_style_text_font(cloud_icon, FONT_NORMAL, 0);
    lv_obj_set_style_text_color(cloud_icon, COLOR_TEXT_MUTED, 0);
    
    // === Decorative arc ring ===
    lv_obj_t* arc_ring = lv_arc_create(container);
    lv_obj_set_size(arc_ring, 300, 300);
    lv_obj_center(arc_ring);
    lv_arc_set_range(arc_ring, 0, 100);
    lv_arc_set_value(arc_ring, 100);
    lv_arc_set_bg_angles(arc_ring, 0, 360);
    lv_obj_set_style_arc_color(arc_ring, COLOR_BG_ELEVATED, LV_PART_MAIN);
    lv_obj_set_style_arc_width(arc_ring, 3, LV_PART_MAIN);
    lv_obj_set_style_arc_color(arc_ring, COLOR_ACCENT_AMBER, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(arc_ring, 3, LV_PART_INDICATOR);
    lv_obj_set_style_bg_opa(arc_ring, LV_OPA_TRANSP, LV_PART_KNOB);
    lv_obj_clear_flag(arc_ring, LV_OBJ_FLAG_CLICKABLE);
    
    // === Power icon with pulse animation ===
    power_icon = lv_label_create(container);
    lv_label_set_text(power_icon, LV_SYMBOL_POWER);
    lv_obj_set_style_text_font(power_icon, FONT_XLARGE, 0);
    lv_obj_set_style_text_color(power_icon, COLOR_ACCENT_AMBER, 0);
    lv_obj_align(power_icon, LV_ALIGN_CENTER, 0, -60);
    
    // Subtle pulse animation
    lv_anim_t anim;
    lv_anim_init(&anim);
    lv_anim_set_var(&anim, power_icon);
    lv_anim_set_values(&anim, LV_OPA_70, LV_OPA_COVER);
    lv_anim_set_time(&anim, 1500);
    lv_anim_set_repeat_count(&anim, LV_ANIM_REPEAT_INFINITE);
    lv_anim_set_playback_time(&anim, 1500);
    lv_anim_set_exec_cb(&anim, [](void* obj, int32_t v) {
        lv_obj_set_style_opa((lv_obj_t*)obj, v, 0);
    });
    lv_anim_start(&anim);
    
    // === Power Mode Name (large, centered) ===
    mode_name_label = lv_label_create(container);
    lv_label_set_text(mode_name_label, power_mode_names[selected_index]);
    lv_obj_set_style_text_font(mode_name_label, FONT_HUGE, 0);
    lv_obj_set_style_text_color(mode_name_label, COLOR_TEXT_PRIMARY, 0);
    lv_obj_align(mode_name_label, LV_ALIGN_CENTER, 0, 10);
    
    // === Power Mode Description ===
    mode_desc_label = lv_label_create(container);
    lv_label_set_text(mode_desc_label, power_mode_descriptions[selected_index]);
    lv_obj_set_style_text_font(mode_desc_label, FONT_NORMAL, 0);
    lv_obj_set_style_text_color(mode_desc_label, COLOR_TEXT_MUTED, 0);
    lv_obj_align(mode_desc_label, LV_ALIGN_CENTER, 0, 50);
    
    // === Dots indicator ===
    dots_container = lv_obj_create(container);
    lv_obj_remove_style_all(dots_container);
    lv_obj_set_size(dots_container, POWER_MODE_COUNT * 28, 16);
    lv_obj_align(dots_container, LV_ALIGN_CENTER, 0, 90);
    lv_obj_set_flex_flow(dots_container, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(dots_container, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    
    for (int i = 0; i < POWER_MODE_COUNT; i++) {
        mode_dots[i] = lv_obj_create(dots_container);
        lv_obj_set_size(mode_dots[i], 10, 10);
        lv_obj_set_style_radius(mode_dots[i], LV_RADIUS_CIRCLE, 0);
        lv_obj_set_style_border_width(mode_dots[i], 0, 0);
        lv_obj_set_style_pad_left(mode_dots[i], 5, 0);
        lv_obj_set_style_pad_right(mode_dots[i], 5, 0);
        
        if (i == selected_index) {
            lv_obj_set_style_bg_color(mode_dots[i], COLOR_ACCENT_AMBER, 0);
        } else {
            lv_obj_set_style_bg_color(mode_dots[i], COLOR_BG_ELEVATED, 0);
        }
    }
    
    // === Hint at bottom (smaller, subtle) ===
    hint_label = lv_label_create(container);
    lv_label_set_text(hint_label, "Press to start  •  Rotate to select");
    lv_obj_set_style_text_font(hint_label, FONT_SMALL, 0);
    lv_obj_set_style_text_color(hint_label, COLOR_TEXT_MUTED, 0);
    lv_obj_align(hint_label, LV_ALIGN_BOTTOM_MID, 0, -60);
    
    // === Make screen focusable for encoder input ===
    lv_group_t* group = lv_group_get_default();
    if (group) {
        lv_obj_add_flag(screen, LV_OBJ_FLAG_CLICKABLE);
        lv_group_add_obj(group, screen);
        
        // Handle encoder events
        lv_obj_add_event_cb(screen, [](lv_event_t* e) {
            lv_event_code_t code = lv_event_get_code(e);
            if (code == LV_EVENT_KEY) {
                uint32_t key = lv_event_get_key(e);
                if (key == LV_KEY_RIGHT || key == LV_KEY_NEXT) {
                    screen_idle_select_power_mode(selected_index + 1);
                } else if (key == LV_KEY_LEFT || key == LV_KEY_PREV) {
                    screen_idle_select_power_mode(selected_index - 1);
                }
            }
        }, LV_EVENT_KEY, NULL);
        
        lv_group_set_editing(group, true);
    }
    
    LOG_I("Idle screen created");
    return screen;
}

// =============================================================================
// Screen Update
// =============================================================================

void screen_idle_update(const ui_state_t* state) {
    if (!screen || !state) return;
    
    // Update power mode visibility based on machine type
    bool is_dual_boiler = (state->machine_type == 0 || state->machine_type == 1);
    
    if (show_power_modes != is_dual_boiler) {
        screen_idle_set_show_strategies(is_dual_boiler);
    }
    
    // Update connection indicators
    bool conn_changed = (cached_wifi_connected != state->wifi_connected) ||
                        (cached_scale_connected != state->scale_connected) ||
                        (cached_cloud_connected != state->cloud_connected);
    
    if (conn_changed) {
        cached_wifi_connected = state->wifi_connected;
        cached_scale_connected = state->scale_connected;
        cached_cloud_connected = state->cloud_connected;
        update_connection_indicators();
    }
}

void screen_idle_select_power_mode(int index) {
    // Clamp index (wrap around)
    if (index < 0) index = POWER_MODE_COUNT - 1;
    if (index >= POWER_MODE_COUNT) index = 0;
    
    selected_index = index;
    
    // Update UI
    if (mode_name_label) {
        lv_label_set_text(mode_name_label, power_mode_names[selected_index]);
    }
    if (mode_desc_label) {
        lv_label_set_text(mode_desc_label, power_mode_descriptions[selected_index]);
    }
    
    // Update dots
    for (int i = 0; i < POWER_MODE_COUNT; i++) {
        if (mode_dots[i]) {
            if (i == selected_index) {
                lv_obj_set_style_bg_color(mode_dots[i], COLOR_ACCENT_AMBER, 0);
            } else {
                lv_obj_set_style_bg_color(mode_dots[i], COLOR_BG_ELEVATED, 0);
            }
        }
    }
}

// Legacy function name for compatibility
void screen_idle_select_strategy(int index) {
    screen_idle_select_power_mode(index);
}

power_mode_t screen_idle_get_selected_power_mode(void) {
    if (selected_index >= 0 && selected_index < POWER_MODE_COUNT) {
        return (power_mode_t)selected_index;
    }
    return POWER_MODE_BREW_ONLY;
}

heating_strategy_t screen_idle_get_selected_strategy(void) {
    if (selected_index >= 0 && selected_index < POWER_MODE_COUNT) {
        return (heating_strategy_t)power_mode_default_strategy[selected_index];
    }
    return HEAT_BREW_ONLY;
}

void screen_idle_set_turn_on_callback(idle_turn_on_callback_t callback) {
    turn_on_callback = callback;
}

void screen_idle_set_show_strategies(bool show) {
    show_power_modes = show;
    
    // Update visibility of power mode UI elements
    if (mode_name_label) {
        if (show) {
            lv_obj_clear_flag(mode_name_label, LV_OBJ_FLAG_HIDDEN);
        } else {
            // For non-dual-boiler, just show a generic "Ready" message
            lv_label_set_text(mode_name_label, "Ready");
        }
    }
    
    if (mode_desc_label) {
        if (show) {
            lv_obj_clear_flag(mode_desc_label, LV_OBJ_FLAG_HIDDEN);
        } else {
            lv_label_set_text(mode_desc_label, "Press button to start");
        }
    }
    
    if (dots_container) {
        if (show) {
            lv_obj_clear_flag(dots_container, LV_OBJ_FLAG_HIDDEN);
        } else {
            lv_obj_add_flag(dots_container, LV_OBJ_FLAG_HIDDEN);
        }
    }
    
    if (hint_label) {
        if (show) {
            lv_label_set_text(hint_label, "Press to start  •  Rotate to select");
        } else {
            lv_label_set_text(hint_label, "Press to start");
        }
    }
    
    LOG_I("Idle screen: power mode selection %s", show ? "shown" : "hidden");
}

bool screen_idle_is_showing_strategies(void) {
    return show_power_modes;
}

