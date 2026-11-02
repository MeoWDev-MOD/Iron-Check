// Telas do programa mostradas no notebook. As posições dos botões foram medidas no programa real (1440 x 900).
export const SCREEN = { w: 1440, h: 900 };

const zone = (id, i) => ({ id, r: [13, Math.round(115 + i * 39.2), 207, 34] });
export const NAV = {
  testes: ["sistema", "sensores", "video", "processador", "disco", "energia", "rede", "jogos", "gargalo", "overlay"].map(zone),
  entrada: ["tela", "teclado", "touchpad", "usb", "webcam", "audio", "microfone", "saidavideo", "carregador", "portas", "seriais"].map(zone),
  integracao: ["iluminacao"].map(zone),
  otimiza: ["otimiza", "inicializacao", "apps", "drivers", "benchmark", "stress", "overclock", "bootcreator", "memorymeow"].map(zone),
  relatorio: ["relatorio"].map(zone),
  extra: ["extra"].map(zone),
};

export const TABS = [
  { label: { pt: "Iron Check", en: "Iron Check" }, first: "sistema", r: [84, 11, 120, 33] },
  { label: { pt: "Tools", en: "Tools" }, first: "benchmark", r: [212, 11, 82, 33] },
  { label: { pt: "Tela e entrada", en: "Screen and input" }, first: "tela", r: [302, 11, 144, 33] },
  { label: { pt: "Integração", en: "Integration" }, first: "iluminacao", r: [454, 11, 122, 33] },
  { label: { pt: "Relatório", en: "Report" }, first: "relatorio", r: [584, 11, 110, 33] },
  { label: { pt: "Extra", en: "Extra" }, first: "extra", r: [702, 11, 81, 33] },
];

const P = (id, group, ptT, enT, ptD, enD, extra = {}) => ({ id, group, title: { pt: ptT, en: enT }, desc: { pt: ptD, en: enD }, ...extra });

export const PAGES = [
  P("sistema", "testes", "Sistema", "System", "Identifica o aparelho em segundos e roda os testes automáticos.", "Identifies the device in seconds and runs the automatic tests."),
  P("situacao", "testes", "Testes automáticos", "Automatic tests", "Sistema, bateria, disco, memória, processador, Wi-Fi, Bluetooth e drivers em sequência, cada um com o seu veredito.", "System, battery, disk, memory, CPU, Wi-Fi, Bluetooth and drivers in sequence, each with its own verdict."),
  P("sensores", "testes", "Sensores", "Sensors", "Temperaturas, cargas, clocks e consumo em tempo real, com mínimo, máximo e alertas.", "Temperatures, loads, clocks and power in real time, with minimum, maximum and alerts."),
  P("video", "testes", "Placa de vídeo", "Graphics card", "Ficha completa e sensores ao vivo: chip, memória, driver, clocks, temperatura e consumo.", "Full spec sheet and live sensors: chip, memory, driver, clocks, temperature and power."),
  P("processador", "testes", "Processador", "Processor", "Nota de vários núcleos e de um núcleo, e se o desempenho cai com o calor.", "Multi-core and single-core scores, and whether performance drops with heat."),
  P("disco", "testes", "Discos", "Disks", "SMART, varredura de superfície só de leitura e desempenho, com um teste recomendado para HD, SSD SATA e NVMe.", "SMART, read-only surface scan and performance, with a recommended test for HDD, SATA SSD and NVMe."),
  P("energia", "testes", "Energia", "Power", "Saúde da bateria, capacidade atual contra a de fábrica e ciclos de carga.", "Battery health, current capacity against factory capacity and charge cycles."),
  P("rede", "testes", "Rede", "Network", "Diz se o lag vem do Wi-Fi, do provedor ou de fila na conexão. Também verifica o Bluetooth.", "Tells whether lag comes from Wi-Fi, the provider or connection queues. Also checks Bluetooth."),
  P("jogos", "testes", "Jogos", "Games", "Estimativa de como o aparelho se sai em jogos, a partir do hardware lido.", "An estimate of how the device handles games, based on the hardware it read."),
  P("gargalo", "testes", "Gargalo", "Bottleneck", "Mostra qual peça segura o desempenho do conjunto.", "Shows which part is holding the whole system back."),
  P("overlay", "testes", "Overlay", "Overlay", "FPS e sensores numa janela por cima do jogo, com atalho global.", "FPS and sensors in a window over the game, with a global shortcut."),
  P("tela", "entrada", "Tela", "Screen", "Cores cheias para achar pixel morto, mancha e vazamento de luz.", "Solid colors to find dead pixels, stains and light bleed."),
  P("teclado", "entrada", "Teclado", "Keyboard", "Cada tecla acende ao ser apertada. As que não respondem ficam apagadas.", "Each key lights up when pressed. The ones that do not respond stay dark."),
  P("touchpad", "entrada", "Touchpad e mouse", "Touchpad and mouse", "Gesto por gesto, para conferir depois de trocar a peça.", "Gesture by gesture, to check after replacing the part."),
  P("usb", "entrada", "Portas USB", "USB ports", "Plugue em cada porta e veja na hora, com bip. O programa conta as portas diferentes testadas.", "Plug into each port and see it right away, with a beep. The program counts the different ports tested."),
  P("webcam", "entrada", "Webcam", "Webcam", "Esta aba mostra a imagem da câmera, a resolução e os quadros por segundo. Sem foto aqui, porque usa a câmera do aparelho.", "This tab shows the camera image, resolution and frames per second. No picture here, because it uses the device camera.", { noPhoto: true }),
  P("audio", "entrada", "Alto-falantes", "Speakers", "Esquerdo, direito, grave, agudo e varredura. Você marca o que ouviu.", "Left, right, bass, treble and sweep. You mark what you heard."),
  P("microfone", "entrada", "Microfone", "Microphone", "Bata palmas e veja a barra subir. Mede o ruído de fundo e grava 4 segundos para você ouvir.", "Clap and watch the bar rise. It measures background noise and records 4 seconds for you to hear."),
  P("saidavideo", "entrada", "HDMI e vídeo", "HDMI and video", "Confere as saídas de vídeo reconhecidas pelo Windows.", "Checks the video outputs recognized by Windows."),
  P("carregador", "entrada", "Carregador", "Charger", "Mostra na hora se o carregador foi reconhecido.", "Shows right away whether the charger was recognized."),
  P("portas", "entrada", "Portas COM", "COM ports", "Libera números de COM travados, pedindo confirmação antes.", "Frees stuck COM numbers, asking for confirmation first."),
  P("seriais", "entrada", "Drivers seriais", "Serial drivers", "CH340, CP210x, FTDI e Prolific: mostra a placa e reinstala o driver.", "CH340, CP210x, FTDI and Prolific: shows the board and reinstalls the driver."),
  P("iluminacao", "integracao", "Iluminação", "Lighting", "Controla as luzes do aparelho pelo OpenRGB.", "Controls the device lights through OpenRGB."),
  P("otimiza", "otimiza", "Otimiza", "Optimize", "Limpa a RAM e fecha o que atrapalha. Nunca mexe em segurança.", "Clears RAM and closes what gets in the way. Never touches security."),
  P("inicializacao", "otimiza", "Inicialização", "Startup", "Liga e desliga o que abre com o Windows, sem apagar nada. Sem foto aqui, porque a lista é a do computador em uso.", "Turns on and off what opens with Windows, deleting nothing. No picture here, because the list belongs to the computer in use.", { noPhoto: true }),
  P("apps", "otimiza", "Instalar apps", "Install apps", "Os essenciais depois de formatar, com um clique, pelo winget.", "The essentials after formatting, in one click, through winget."),
  P("drivers", "otimiza", "Drivers", "Drivers", "Primeiro a rede, sem internet. Depois vídeo, placa-mãe e o que faltar pelo Windows Update.", "Network first, with no internet. Then video, motherboard and whatever is missing through Windows Update."),
  P("benchmark", "otimiza", "Benchmark", "Benchmark", "Sete testes com nota, para comparar antes e depois do conserto.", "Seven scored tests, to compare before and after the repair."),
  P("stress", "otimiza", "Stress test", "Stress test", "Processador, memória e placa de vídeo juntos, com corte automático por temperatura.", "CPU, memory and graphics card together, with automatic temperature cutoff."),
  P("overclock", "otimiza", "Overclock", "Overclock", "Ajustes temporários e oficiais da placa NVIDIA, com verificador de estabilidade.", "Temporary, official NVIDIA card settings, with a stability checker."),
  P("bootcreator", "otimiza", "Criador de Boot", "Boot Creator", "Pendrive UEFI de ISO do Windows ou do Linux. Nunca toca no disco do sistema.", "UEFI USB drive from a Windows or Linux ISO. Never touches the system disk."),
  P("memorymeow", "otimiza", "Memory MeoW", "Memory MeoW", "Grava e confere a memória de vídeo em 12 padrões e aponta a causa provável do defeito.", "Writes and checks video memory in 12 patterns and points to the likely cause of the fault."),
  P("relatorio", "relatorio", "Relatório", "Report", "Loja, OS e cliente, o resultado de todos os testes e o botão que gera o laudo em PDF.", "Shop, work order and customer, every test result and the button that creates the PDF report."),
  P("extra", "extra", "Extra", "Extra", "Quem fez e como falar com o desenvolvedor.", "Who made it and how to reach the developer."),
];

// Atalhos abaixo do notebook: as telas que mais vendem, e a navegação de quem está no celular.
export const CHIPS = ["sistema", "situacao", "disco", "tela", "teclado", "usb", "sensores", "benchmark", "stress", "memorymeow", "drivers", "relatorio"];
