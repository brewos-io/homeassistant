#include "display/lv_fs_littlefs.h"
#include <LittleFS.h>
#include <Arduino.h>

// Helper to cast void* to File*
static File* get_file(void* file_p) {
    return (File*)file_p;
}

static void* fs_open(lv_fs_drv_t* drv, const char* path, lv_fs_mode_t mode) {
    const char* flags = "";
    if(mode == LV_FS_MODE_WR) flags = "w";
    else if(mode == LV_FS_MODE_RD) flags = "r";
    else if(mode == (LV_FS_MODE_WR | LV_FS_MODE_RD)) flags = "r+";

    // Prepend slash if missing
    String fpath = String(path);
    if (!fpath.startsWith("/")) fpath = "/" + fpath;

    if (!LittleFS.exists(fpath) && (mode == LV_FS_MODE_RD)) {
        return NULL;
    }

    File f = LittleFS.open(fpath, flags);
    if (!f) return NULL;

    // Allocate File object on heap to persist
    File* file_p = new File(f);
    return (void*)file_p;
}

static lv_fs_res_t fs_close(lv_fs_drv_t* drv, void* file_p) {
    File* fp = get_file(file_p);
    if (fp) {
        fp->close();
        delete fp;
    }
    return LV_FS_RES_OK;
}

static lv_fs_res_t fs_read(lv_fs_drv_t* drv, void* file_p, void* buf, uint32_t btr, uint32_t* br) {
    File* fp = get_file(file_p);
    if (!fp) return LV_FS_RES_INV_PARAM;

    *br = fp->read((uint8_t*)buf, btr);
    return LV_FS_RES_OK;
}

static lv_fs_res_t fs_seek(lv_fs_drv_t* drv, void* file_p, uint32_t pos, lv_fs_whence_t whence) {
    File* fp = get_file(file_p);
    if (!fp) return LV_FS_RES_INV_PARAM;

    SeekMode mode;
    if (whence == LV_FS_SEEK_SET) mode = SeekSet;
    else if (whence == LV_FS_SEEK_CUR) mode = SeekCur;
    else if (whence == LV_FS_SEEK_END) mode = SeekEnd;
    else return LV_FS_RES_INV_PARAM;

    if (fp->seek(pos, mode)) return LV_FS_RES_OK;
    return LV_FS_RES_UNKNOWN;
}

static lv_fs_res_t fs_tell(lv_fs_drv_t* drv, void* file_p, uint32_t* pos_p) {
    File* fp = get_file(file_p);
    if (!fp) return LV_FS_RES_INV_PARAM;

    *pos_p = fp->position();
    return LV_FS_RES_OK;
}

void lv_fs_littlefs_init(void) {
    static lv_fs_drv_t fs_drv;
    lv_fs_drv_init(&fs_drv);

    fs_drv.letter = 'S';
    fs_drv.open_cb = fs_open;
    fs_drv.close_cb = fs_close;
    fs_drv.read_cb = fs_read;
    fs_drv.seek_cb = fs_seek;
    fs_drv.tell_cb = fs_tell;

    lv_fs_drv_register(&fs_drv);
}

