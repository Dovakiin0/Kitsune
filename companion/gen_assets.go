//go:build ignore

package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/png"
	"os"
)

const appManifestXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity version="1.0.0.0" processorArchitecture="amd64" name="Kitsune.Companion" type="win32"/>
  <description>Kitsune Companion</description>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="asInvoker" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/>
      <supportedOS Id="{1f676c76-80e1-4239-95bb-83d0f6d0da78}"/>
    </application>
  </compatibility>
  <application xmlns="urn:schemas-microsoft-com:asm.v3">
    <windowsSettings>
      <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
      <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2,PerMonitor</dpiAwareness>
    </windowsSettings>
  </application>
</assembly>`

func align8(n int) int {
	return (n + 7) &^ 7
}

// buildWindowsSyso builds a valid x86_64 COFF (.syso) file containing:
// - RT_ICON (ID 3, item 1): PNG icon payload
// - RT_GROUP_ICON (ID 14, item 1): GRPICONDIR header pointing to RT_ICON 1
// - RT_MANIFEST (ID 24, item 1): Windows 10/11 application manifest
func buildWindowsSyso(pngBytes []byte, width, height int) []byte {
	// GRPICONDIR (6 bytes) + GRPICONDIRENTRY (14 bytes) = 20 bytes
	var grpIcon bytes.Buffer
	_ = binary.Write(&grpIcon, binary.LittleEndian, uint16(0)) // idReserved
	_ = binary.Write(&grpIcon, binary.LittleEndian, uint16(1)) // idType = 1 (ICON)
	_ = binary.Write(&grpIcon, binary.LittleEndian, uint16(1)) // idCount = 1
	wByte := byte(width)
	if width >= 256 {
		wByte = 0
	}
	hByte := byte(height)
	if height >= 256 {
		hByte = 0
	}
	grpIcon.WriteByte(wByte)                                                  // bWidth
	grpIcon.WriteByte(hByte)                                                  // bHeight
	grpIcon.WriteByte(0)                                                      // bColorCount
	grpIcon.WriteByte(0)                                                      // bReserved
	_ = binary.Write(&grpIcon, binary.LittleEndian, uint16(1))                // wPlanes
	_ = binary.Write(&grpIcon, binary.LittleEndian, uint16(32))               // wBitCount
	_ = binary.Write(&grpIcon, binary.LittleEndian, uint32(len(pngBytes)))    // dwBytesInRes
	_ = binary.Write(&grpIcon, binary.LittleEndian, uint16(1))                // nID = 1
	grpBytes := grpIcon.Bytes()

	manifestBytes := []byte(appManifestXML)

	// Layout of .rsrc section:
	// 0x000: Root Dir (16B) + 3 entries (3*8=24B) -> 40B (0x000..0x028)
	// 0x028: Type 3 (RT_ICON) Dir (16B) + 1 entry (8B) -> 24B (0x028..0x040)
	// 0x040: Type 14 (RT_GROUP_ICON) Dir (16B) + 1 entry (8B) -> 24B (0x040..0x058)
	// 0x058: Type 24 (RT_MANIFEST) Dir (16B) + 1 entry (8B) -> 24B (0x058..0x070)
	// 0x070: Name 1 Dir for Type 3 (16B) + 1 entry (8B) -> 24B (0x070..0x088)
	// 0x088: Name 1 Dir for Type 14 (16B) + 1 entry (8B) -> 24B (0x088..0x0A0)
	// 0x0A0: Name 1 Dir for Type 24 (16B) + 1 entry (8B) -> 24B (0x0A0..0x0B8)
	// 0x0B8: Data Entry 1 (Type 3, 16B) -> 0x0B8..0x0C8 (OffsetToData at 0x0B8)
	// 0x0C8: Data Entry 2 (Type 14, 16B) -> 0x0C8..0x0D8 (OffsetToData at 0x0C8)
	// 0x0D8: Data Entry 3 (Type 24, 16B) -> 0x0D8..0x0E8 (OffsetToData at 0x0D8)
	// 0x0E8: Raw Payload 1 (pngBytes), padded to 8B
	// +    : Raw Payload 2 (grpBytes), padded to 8B
	// +    : Raw Payload 3 (manifestBytes), padded to 8B

	const dirTreeSize = 0x0E8
	offPNG := dirTreeSize
	offGrp := offPNG + align8(len(pngBytes))
	offMan := offGrp + align8(len(grpBytes))
	totalRsrcSize := offMan + align8(len(manifestBytes))

	var rsrc bytes.Buffer
	writeDir := func(idCount uint16) {
		_ = binary.Write(&rsrc, binary.LittleEndian, uint32(0)) // Characteristics
		_ = binary.Write(&rsrc, binary.LittleEndian, uint32(0)) // TimeDateStamp
		_ = binary.Write(&rsrc, binary.LittleEndian, uint16(0)) // MajorVersion
		_ = binary.Write(&rsrc, binary.LittleEndian, uint16(0)) // MinorVersion
		_ = binary.Write(&rsrc, binary.LittleEndian, uint16(0)) // NumberOfNamedEntries
		_ = binary.Write(&rsrc, binary.LittleEndian, idCount)   // NumberOfIdEntries
	}
	writeEntry := func(id uint32, offset uint32, isSubdir bool) {
		_ = binary.Write(&rsrc, binary.LittleEndian, id)
		if isSubdir {
			offset |= 0x80000000
		}
		_ = binary.Write(&rsrc, binary.LittleEndian, offset)
	}
	writeDataEntry := func(offset, size uint32) {
		_ = binary.Write(&rsrc, binary.LittleEndian, offset)
		_ = binary.Write(&rsrc, binary.LittleEndian, size)
		_ = binary.Write(&rsrc, binary.LittleEndian, uint32(0)) // CodePage
		_ = binary.Write(&rsrc, binary.LittleEndian, uint32(0)) // Reserved
	}

	// Root Dir (3 types: 3, 14, 24)
	writeDir(3)
	writeEntry(3, 0x028, true)
	writeEntry(14, 0x040, true)
	writeEntry(24, 0x058, true)

	// Type 3 Dir -> Name 1 at 0x070
	writeDir(1)
	writeEntry(1, 0x070, true)

	// Type 14 Dir -> Name 1 at 0x088
	writeDir(1)
	writeEntry(1, 0x088, true)

	// Type 24 Dir -> Name 1 at 0x0A0
	writeDir(1)
	writeEntry(1, 0x0A0, true)

	// Name 1 Dir (Type 3) -> Lang 0x0409 -> DataEntry at 0x0B8
	writeDir(1)
	writeEntry(0x0409, 0x0B8, false)

	// Name 1 Dir (Type 14) -> Lang 0x0409 -> DataEntry at 0x0C8
	writeDir(1)
	writeEntry(0x0409, 0x0C8, false)

	// Name 1 Dir (Type 24) -> Lang 0x0409 -> DataEntry at 0x0D8
	writeDir(1)
	writeEntry(0x0409, 0x0D8, false)

	// 3 Data Entries
	writeDataEntry(uint32(offPNG), uint32(len(pngBytes)))
	writeDataEntry(uint32(offGrp), uint32(len(grpBytes)))
	writeDataEntry(uint32(offMan), uint32(len(manifestBytes)))

	// Payloads padded to 8-byte boundaries
	rsrc.Write(pngBytes)
	for rsrc.Len() < offGrp {
		rsrc.WriteByte(0)
	}
	rsrc.Write(grpBytes)
	for rsrc.Len() < offMan {
		rsrc.WriteByte(0)
	}
	rsrc.Write(manifestBytes)
	for rsrc.Len() < totalRsrcSize {
		rsrc.WriteByte(0)
	}

	rsrcBytes := rsrc.Bytes()

	// COFF Object layout:
	// 0..20: IMAGE_FILE_HEADER (20B)
	// 20..60: IMAGE_SECTION_HEADER ".rsrc" (40B)
	// 60..60+totalRsrcSize: section raw data
	// relocOffset: 3 COFF relocations (3 * 10B = 30B)
	// symOffset: 1 COFF symbol (18B) + 4B string table
	const fileHdrSize = 20
	const secHdrSize = 40
	rawOffset := uint32(fileHdrSize + secHdrSize)
	relocOffset := rawOffset + uint32(len(rsrcBytes))
	symOffset := relocOffset + 3*10

	var coff bytes.Buffer
	// IMAGE_FILE_HEADER
	_ = binary.Write(&coff, binary.LittleEndian, uint16(0x8664)) // Machine = AMD64
	_ = binary.Write(&coff, binary.LittleEndian, uint16(1))      // NumberOfSections = 1
	_ = binary.Write(&coff, binary.LittleEndian, uint32(0))      // TimeDateStamp
	_ = binary.Write(&coff, binary.LittleEndian, symOffset)      // PointerToSymbolTable
	_ = binary.Write(&coff, binary.LittleEndian, uint32(1))      // NumberOfSymbols = 1
	_ = binary.Write(&coff, binary.LittleEndian, uint16(0))      // SizeOfOptionalHeader = 0
	_ = binary.Write(&coff, binary.LittleEndian, uint16(0))      // Characteristics = 0

	// IMAGE_SECTION_HEADER (.rsrc)
	var secName [8]byte
	copy(secName[:], ".rsrc")
	coff.Write(secName[:])
	_ = binary.Write(&coff, binary.LittleEndian, uint32(0))              // VirtualSize
	_ = binary.Write(&coff, binary.LittleEndian, uint32(0))              // VirtualAddress
	_ = binary.Write(&coff, binary.LittleEndian, uint32(len(rsrcBytes))) // SizeOfRawData
	_ = binary.Write(&coff, binary.LittleEndian, rawOffset)              // PointerToRawData
	_ = binary.Write(&coff, binary.LittleEndian, relocOffset)            // PointerToRelocations
	_ = binary.Write(&coff, binary.LittleEndian, uint32(0))              // PointerToLinenumbers
	_ = binary.Write(&coff, binary.LittleEndian, uint16(3))              // NumberOfRelocations = 3
	_ = binary.Write(&coff, binary.LittleEndian, uint16(0))              // NumberOfLinenumbers = 0
	_ = binary.Write(&coff, binary.LittleEndian, uint32(0x40000040))     // Characteristics: INITIALIZED_DATA | MEM_READ

	// Section Data
	coff.Write(rsrcBytes)

	// 3 Relocations (for DataEntry OffsetToData at 0x0B8, 0x0C8, 0x0D8)
	// IMAGE_REL_AMD64_ADDR32NB = 0x0003
	for _, rvaOff := range []uint32{0x0B8, 0x0C8, 0x0D8} {
		_ = binary.Write(&coff, binary.LittleEndian, rvaOff)
		_ = binary.Write(&coff, binary.LittleEndian, uint32(0))      // SymbolTableIndex = 0
		_ = binary.Write(&coff, binary.LittleEndian, uint16(0x0003)) // Type = ADDR32NB
	}

	// 1 Symbol (.rsrc section symbol)
	coff.Write(secName[:])                                  // Name
	_ = binary.Write(&coff, binary.LittleEndian, uint32(0)) // Value = 0
	_ = binary.Write(&coff, binary.LittleEndian, int16(1))  // SectionNumber = 1
	_ = binary.Write(&coff, binary.LittleEndian, uint16(0)) // Type = 0
	coff.WriteByte(3)                                       // StorageClass = IMAGE_SYM_CLASS_STATIC (3)
	coff.WriteByte(0)                                       // NumberOfAuxSymbols = 0

	// Empty COFF String Table (4 bytes size = 4)
	_ = binary.Write(&coff, binary.LittleEndian, uint32(4))

	return coff.Bytes()
}

// buildMacICNS wraps a PNG into an Apple .icns container ("ic08" 256x256 PNG icon).
func buildMacICNS(pngBytes []byte) []byte {
	var icns bytes.Buffer
	totalLen := uint32(8 + 8 + len(pngBytes))
	icns.WriteString("icns")
	_ = binary.Write(&icns, binary.BigEndian, totalLen)
	icns.WriteString("ic08")
	_ = binary.Write(&icns, binary.BigEndian, uint32(8+len(pngBytes)))
	icns.Write(pngBytes)
	return icns.Bytes()
}

func main() {
	srcPath := "../public/icon-192x192.png"
	pngBytes, err := os.ReadFile(srcPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to read %s: %v", srcPath, err))
	}

	cfg, err := png.DecodeConfig(bytes.NewReader(pngBytes))
	if err != nil {
		cfg = image.Config{Width: 192, Height: 192}
	}

	if err := os.WriteFile("icon.png", pngBytes, 0644); err != nil {
		panic(err)
	}

	sysoBytes := buildWindowsSyso(pngBytes, cfg.Width, cfg.Height)
	if err := os.WriteFile("rsrc_windows_amd64.syso", sysoBytes, 0644); err != nil {
		panic(err)
	}

	icnsBytes := buildMacICNS(pngBytes)
	if err := os.WriteFile("icon.icns", icnsBytes, 0644); err != nil {
		panic(err)
	}

	fmt.Printf("Generated icon.png (%dB), rsrc_windows_amd64.syso (%dB), icon.icns (%dB)\n",
		len(pngBytes), len(sysoBytes), len(icnsBytes))
}
