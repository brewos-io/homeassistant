/**
 * BrewOS Splash Screen
 * 
 * Shows logo during boot initialization
 */

#include "platform/platform.h"
#include "ui/screen_splash.h"
#include "ui/logo_splash.h"
#include "display/theme.h"
#include "display/display_config.h"

static lv_obj_t* screen = nullptr;

lv_obj_t* screen_splash_create(void) {
    LOG_I("Creating splash screen...");
    
    // Create screen with black background
    screen = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(screen, lv_color_black(), 0);
    lv_obj_set_style_bg_opa(screen, LV_OPA_COVER, 0);
    
    // Create main container
    lv_obj_t* container = lv_obj_create(screen);
    lv_obj_remove_style_all(container);
    lv_obj_set_size(container, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    lv_obj_center(container);
    lv_obj_clear_flag(container, LV_OBJ_FLAG_SCROLLABLE);
    
    // Display embedded logo image (converted to C array)
    lv_obj_t* logo = lv_img_create(container);
    lv_img_set_src(logo, &logo_splash_img);
    lv_obj_align(logo, LV_ALIGN_CENTER, 0, -20); // Slightly above center
    
    // Loading text
    lv_obj_t* label = lv_label_create(container);
    lv_label_set_text(label, "INITIALIZING...");
    lv_obj_set_style_text_font(label, FONT_SMALL, 0);
    lv_obj_set_style_text_color(label, COLOR_TEXT_MUTED, 0);
    lv_obj_set_style_text_letter_space(label, 2, 0);
    lv_obj_align(label, LV_ALIGN_BOTTOM_MID, 0, -30);
    
    return screen;
}

