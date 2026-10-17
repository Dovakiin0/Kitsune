//go:build !windows

package main

import (
	"os/exec"
	"runtime"
)

func openControlWindow(url string) {
	if runtime.GOOS == "darwin" {
		_ = exec.Command("open", url).Start()
		return
	}
	for _, bin := range []string{"google-chrome", "chromium", "chromium-browser", "brave-browser"} {
		if path, err := exec.LookPath(bin); err == nil {
			if exec.Command(path, "--app="+url, "--window-size=440,520").Start() == nil {
				return
			}
		}
	}
	_ = exec.Command("xdg-open", url).Start()
}

func runPlatformTray(state *CompanionState, _ string) {
	<-state.quitCh
}
