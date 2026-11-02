// Telas do programa mostradas no notebook. As posições dos botões foram medidas no programa real (1440 x 900),
// em português e em inglês quando o texto muda a largura do botão.
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
  { label: { pt: "Iron Check", en: "Iron Check" }, first: "sistema", r: { pt: [84, 11, 120, 33], en: [84, 11, 120, 33] } },
  { label: { pt: "Tools", en: "Tools" }, first: "benchmark", r: { pt: [212, 11, 82, 33], en: [212, 11, 82, 33] } },
  { label: { pt: "Tela e entrada", en: "Screen and input" }, first: "tela", r: { pt: [302, 11, 144, 33], en: [302, 11, 145, 33] } },
  { label: { pt: "Integração", en: "Integration" }, first: "iluminacao", r: { pt: [454, 11, 122, 33], en: [455, 11, 125, 33] } },
  { label: { pt: "Relatório", en: "Report" }, first: "relatorio", r: { pt: [584, 11, 110, 33], en: [589, 11, 89, 33] } },
  { label: { pt: "Extra", en: "Extra" }, first: "extra", r: { pt: [702, 11, 81, 33], en: [686, 11, 81, 33] } },
];

// Interruptor de idioma do programa (bandeiras no alto, à direita).
export const LANG_BTN = [1163, 10, 78, 36];

// Sub-abas do Benchmark: foto de cada uma e o vídeo da animação dela, gravado do programa (o chip e a escultura de luz
// não têm texto; mundo aberto, memória e disco escrevem no desenho, por isso têm vídeo em cada idioma).
const STAGE = [322, 259, 589, 331];
const ROWS = [322, 259, 589, 229];
const B = (id, ptL, enL, ptD, enD, video, v, pt, en) => ({ id, label: { pt: ptL, en: enL }, desc: { pt: ptD, en: enD }, video, v, r: { pt, en } });
export const BENCH = [
  B("render", "Render (CPU)", "Render (CPU)", "O processador calcula uma imagem em path tracing em todas as threads, no mesmo princípio do Cinebench.", "The processor computes a path-traced image on every thread, on the same principle as Cinebench.", "render", STAGE, [288, 188, 104, 29], [288, 188, 104, 29]),
  B("cena", "Cena de jogo (GPU)", "Game scene (GPU)", "O chip em 3D com carga total na placa de vídeo. A nota é a carga que ela sustenta.", "The 3D chip at full load on the graphics card. The score is the load it sustains.", "cena", STAGE, [400, 188, 141, 29], [400, 188, 134, 29]),
  B("rt", "Ray tracing (GPU)", "Ray tracing (GPU)", "Escultura de luz com reflexo, refração e sombra suave, calculada raio a raio pela placa.", "A light sculpture with reflections, refraction and soft shadows, computed ray by ray by the card.", "rt", STAGE, [549, 188, 128, 29], [542, 188, 128, 29]),
  B("dlss", "DLSS 5", "DLSS 5", "Diz se a placa tem DLSS 5 e mostra quanto FPS a reconstrução de imagem ganha.", "Tells whether the card supports DLSS 5 and shows how many FPS image reconstruction gains.", "rt", STAGE, [686, 188, 68, 29], [679, 188, 68, 29]),
  B("sim", "Simulação de jogo (CPU)", "Game simulation (CPU)", "Um mundo aberto com 30 mil unidades vivas, calculado em todas as threads do processador.", "An open world with 30 thousand living units, computed on every processor thread.", "sim-{lang}", STAGE, [761, 188, 170, 29], [754, 188, 160, 29]),
  B("mem", "Memória e carregamento", "Memory and loading", "Latência e banda da RAM, e quanto tempo um mapa de jogo leva para carregar do disco.", "RAM latency and bandwidth, and how long a game map takes to load from the disk.", "mem-{lang}", ROWS, [939, 188, 174, 29], [923, 188, 148, 29]),
  B("disco", "Disco", "Disk", "Leitura e escrita sequenciais e acessos aleatórios de 4 KB, direto no disco, sem o cache do Windows.", "Sequential read and write and random 4 KB access, straight to the disk, without the Windows cache.", "disco-{lang}", ROWS, [1121, 188, 59, 29], [1079, 188, 52, 29]),
];

// Bandeiras do interruptor, iguais às do programa (src/i18n.js).
const flagBR = '<svg viewBox="0 0 72 50" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="72" height="50" fill="#009c3b"/><path d="M36 4 68 25 36 46 4 25Z" fill="#ffdf00"/><circle cx="36" cy="25" r="11.5" fill="#002776"/><path d="M25 27.4c7.6-3.8 15.6-3.4 22.2 1.8" stroke="#fff" stroke-width="2.4" fill="none"/><g fill="#fff"><circle cx="31" cy="21" r=".9"/><circle cx="36" cy="19" r=".9"/><circle cx="41" cy="21.5" r=".9"/><circle cx="33" cy="30" r=".8"/><circle cx="39" cy="31" r=".8"/><circle cx="29.5" cy="25" r=".7"/><circle cx="43.5" cy="26" r=".7"/></g></svg>';
function flagUS() {
  const h = 40 / 13;
  let s = '<svg viewBox="0 0 76 40" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="76" height="40" fill="#fff"/>';
  for (let i = 0; i < 13; i += 2) s += `<rect y="${(i * h).toFixed(2)}" width="76" height="${h.toFixed(2)}" fill="#b22234"/>`;
  s += `<rect width="31" height="${(7 * h).toFixed(2)}" fill="#3c3b6e"/><g fill="#fff">`;
  for (let r = 0; r < 9; r++) {
    const cols = r % 2 ? 5 : 6;
    for (let c = 0; c < cols; c++) s += `<circle cx="${(r % 2 ? 5.2 + c * 5.1 : 2.6 + c * 5.1).toFixed(1)}" cy="${(2.1 + r * 2.15).toFixed(1)}" r=".85"/>`;
  }
  return s + "</g></svg>";
}
export const FLAGS = { pt: flagBR, en: flagUS() };

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
