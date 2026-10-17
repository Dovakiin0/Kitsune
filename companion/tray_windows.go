//go:build windows

package main

import (
	"os/exec"
	"runtime"
	"syscall"
	"unsafe"
)

var (
	user32               = syscall.NewLazyDLL("user32.dll")
	shell32              = syscall.NewLazyDLL("shell32.dll")
	kernel32             = syscall.NewLazyDLL("kernel32.dll")
	procRegisterClassExW = user32.NewProc("RegisterClassExW")
	procCreateWindowExW  = user32.NewProc("CreateWindowExW")
	procDefWindowProcW   = user32.NewProc("DefWindowProcW")
	procGetMessageW      = user32.NewProc("GetMessageW")
	procTranslateMessage = user32.NewProc("TranslateMessage")
	procDispatchMessageW = user32.NewProc("DispatchMessageW")
	procPostQuitMessage  = user32.NewProc("PostQuitMessage")
	procPostMessageW     = user32.NewProc("PostMessageW")
	procCreatePopupMenu  = user32.NewProc("CreatePopupMenu")
	procAppendMenuW      = user32.NewProc("AppendMenuW")
	procTrackPopupMenu   = user32.NewProc("TrackPopupMenu")
	procDestroyMenu      = user32.NewProc("DestroyMenu")
	procGetCursorPos     = user32.NewProc("GetCursorPos")
	procSetForegroundWnd = user32.NewProc("SetForegroundWindow")
	procLoadIconW                = user32.NewProc("LoadIconW")
	procCreateIconFromResourceEx = user32.NewProc("CreateIconFromResourceEx")
	procShellNotifyIconW         = shell32.NewProc("Shell_NotifyIconW")
	procGetModuleHandleW         = kernel32.NewProc("GetModuleHandleW")
)

const (
	wmApp        = 0x8000
	wmTrayIcon   = wmApp + 1
	wmCommand    = 0x0111
	wmDestroy    = 0x0002
	wmLButtonDbl = 0x0203
	wmRButtonUp  = 0x0205

	nimAdd     = 0x00000000
	nimDelete  = 0x00000002
	nifMessage = 0x00000001
	nifIcon    = 0x00000002
	nifTip     = 0x00000004

	idiApplication = 32512
	lrDefaultColor = 0x00000000
	iconResVer     = 0x00030000
	mfString       = 0x00000000
	mfSeparator    = 0x00000800
	tpmBottomAlign = 0x0020
	tpmLeftAlign   = 0x0000

	idMenuOpen   = 1001
	idMenuToggle = 1002
	idMenuQuit   = 1003
)

type wndClassExW struct {
	cbSize        uint32
	style         uint32
	lpfnWndProc   uintptr
	cbClsExtra    int32
	cbWndExtra    int32
	hInstance     uintptr
	hIcon         uintptr
	hCursor       uintptr
	hbrBackground uintptr
	lpszMenuName  *uint16
	lpszClassName *uint16
	hIconSm       uintptr
}

type notifyIconDataW struct {
	cbSize           uint32
	hWnd             uintptr
	uID              uint32
	uFlags           uint32
	uCallbackMessage uint32
	hIcon            uintptr
	szTip            [128]uint16
}

type point struct {
	x, y int32
}

type msg struct {
	hwnd    uintptr
	message uint32
	wParam  uintptr
	lParam  uintptr
	time    uint32
	pt      point
}

var (
	globalState *CompanionState
	globalUIURL string
)

func openControlWindow(url string) {
	if err := exec.Command("cmd", "/c", "start", "msedge", "--app="+url, "--window-size=440,520").Start(); err == nil {
		return
	}
	_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
}

func wndProc(hwnd uintptr, message uint32, wParam, lParam uintptr) uintptr {
	switch message {
	case wmTrayIcon:
		low := uint32(lParam & 0xffff)
		if low == wmLButtonDbl {
			openControlWindow(globalUIURL)
		} else if low == wmRButtonUp {
			showTrayMenu(hwnd)
		}
		return 0
	case wmCommand:
		id := int(wParam & 0xffff)
		switch id {
		case idMenuOpen:
			openControlWindow(globalUIURL)
		case idMenuToggle:
			if globalState != nil {
				globalState.SetRunning(!globalState.running.Load())
			}
		case idMenuQuit:
			if globalState != nil {
				select {
				case <-globalState.quitCh:
				default:
					close(globalState.quitCh)
				}
			}
			procPostQuitMessage.Call(0)
		}
		return 0
	case wmDestroy:
		procPostQuitMessage.Call(0)
		return 0
	}
	ret, _, _ := procDefWindowProcW.Call(hwnd, uintptr(message), wParam, lParam)
	return ret
}

func showTrayMenu(hwnd uintptr) {
	hMenu, _, _ := procCreatePopupMenu.Call()
	if hMenu == 0 {
		return
	}
	defer procDestroyMenu.Call(hMenu)

	openLabel, _ := syscall.UTF16PtrFromString("Open")
	toggleText := "Stop"
	if globalState != nil && !globalState.running.Load() {
		toggleText = "Start"
	}
	toggleLabel, _ := syscall.UTF16PtrFromString(toggleText)
	quitLabel, _ := syscall.UTF16PtrFromString("Quit")

	procAppendMenuW.Call(hMenu, mfString, idMenuOpen, uintptr(unsafe.Pointer(openLabel)))
	procAppendMenuW.Call(hMenu, mfString, idMenuToggle, uintptr(unsafe.Pointer(toggleLabel)))
	procAppendMenuW.Call(hMenu, mfSeparator, 0, 0)
	procAppendMenuW.Call(hMenu, mfString, idMenuQuit, uintptr(unsafe.Pointer(quitLabel)))

	var pt point
	procGetCursorPos.Call(uintptr(unsafe.Pointer(&pt)))
	procSetForegroundWnd.Call(hwnd)
	procTrackPopupMenu.Call(hMenu, tpmBottomAlign|tpmLeftAlign, uintptr(pt.x), uintptr(pt.y), 0, hwnd, 0)
}

func loadEmbeddedTrayIcon() uintptr {
	if len(iconPNG) > 0 {
		hIcon, _, _ := procCreateIconFromResourceEx.Call(
			uintptr(unsafe.Pointer(&iconPNG[0])),
			uintptr(len(iconPNG)),
			1,
			iconResVer,
			32,
			32,
			lrDefaultColor,
		)
		if hIcon != 0 {
			return hIcon
		}
	}
	hIcon, _, _ := procLoadIconW.Call(0, uintptr(idiApplication))
	return hIcon
}

func runPlatformTray(state *CompanionState, uiURL string) {
	runtime.LockOSThread()
	globalState = state
	globalUIURL = uiURL

	hInstance, _, _ := procGetModuleHandleW.Call(0)
	className, _ := syscall.UTF16PtrFromString("KitsuneCompanionTrayClass")
	hIcon := loadEmbeddedTrayIcon()

	wc := wndClassExW{
		cbSize:        uint32(unsafe.Sizeof(wndClassExW{})),
		lpfnWndProc:   syscall.NewCallback(wndProc),
		hInstance:     hInstance,
		hIcon:         hIcon,
		hIconSm:       hIcon,
		lpszClassName: className,
	}
	procRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc)))

	hwnd, _, _ := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(className)),
		0, 0, 0, 0, 0, 0, 0, hInstance, 0,
	)

	var nid notifyIconDataW
	nid.cbSize = uint32(unsafe.Sizeof(nid))
	nid.hWnd = hwnd
	nid.uID = 1
	nid.uFlags = nifMessage | nifIcon | nifTip
	nid.uCallbackMessage = wmTrayIcon
	nid.hIcon = hIcon
	tip, _ := syscall.UTF16FromString("Kitsune Companion")
	copy(nid.szTip[:], tip)

	procShellNotifyIconW.Call(nimAdd, uintptr(unsafe.Pointer(&nid)))
	defer procShellNotifyIconW.Call(nimDelete, uintptr(unsafe.Pointer(&nid)))

	go func() {
		<-state.quitCh
		procPostMessageW.Call(hwnd, wmDestroy, 0, 0)
	}()

	var m msg
	for {
		ret, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if int32(ret) <= 0 {
			break
		}
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&m)))
	}
}
