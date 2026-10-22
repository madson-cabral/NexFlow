export type IdentityFilter = "all" | "brand" | "application" | "digital";
export type IdentityPiece = {id: string; title: string; category: Exclude<IdentityFilter, "all">; description: string; crop: [number, number, number, number]};
export type IdentityReference = {id: string; name: string; subtitle: string; description: string; image: string; width: number; height: number; background: string; colors: string[]; pieces: IdentityPiece[]};

export const identityFilters: {id: IdentityFilter; label: string}[] = [
  {id: "all", label: "Visão geral"}, {id: "brand", label: "Marca"},
  {id: "application", label: "Aplicações"}, {id: "digital", label: "Digital"},
];

export const identityReferences: IdentityReference[] = [
  {
    id: "amateur", name: "Amateur", subtitle: "Contraste e presença.",
    description: "Um símbolo consistente em produtos, materiais e telas. O preto e branco mantém a leitura da marca em diferentes contextos.",
    image: "/assets/visual-identity/amateur.png", width: 1504, height: 1128, background: "#1b1b1b",
    colors: ["#1B1B1B", "#E7E7E7", "#FFFFFF"],
    pieces: [
      {id: "logo", title: "Símbolo e assinatura", category: "brand", description: "O símbolo geométrico e o nome aparecem juntos sobre um fundo claro.", crop: [0, 0, 500, 375]},
      {id: "watch", title: "Marca no relógio", category: "digital", description: "A versão compacta do símbolo preserva a identificação em uma tela pequena.", crop: [502, 0, 500, 375]},
      {id: "shirt", title: "Aplicação em vestuário", category: "application", description: "O símbolo em branco cria contraste sobre a camiseta preta.", crop: [1004, 0, 500, 375]},
      {id: "card", title: "Cartão de apresentação", category: "application", description: "A assinatura completa aparece em uma peça física de apresentação.", crop: [0, 377, 500, 374]},
      {id: "pattern", title: "Padrão da marca", category: "application", description: "A repetição do símbolo forma um padrão que pode acompanhar embalagens e produtos.", crop: [502, 377, 500, 374]},
      {id: "outdoor", title: "Comunicação externa", category: "application", description: "Uma aplicação em grande formato mostra o comportamento da marca à distância.", crop: [1004, 377, 500, 374]},
      {id: "helmet", title: "Aplicação em equipamento", category: "application", description: "Símbolo e nome se adaptam à superfície curva do equipamento.", crop: [0, 753, 500, 375]},
      {id: "campaign", title: "Assinatura sobre fotografia", category: "brand", description: "A versão clara mantém o contraste sobre uma imagem escura.", crop: [502, 753, 500, 375]},
      {id: "phone", title: "Presença no celular", category: "digital", description: "Uma aplicação vertical apresenta o símbolo em destaque na tela.", crop: [1004, 753, 500, 375]},
    ],
  },
  {
    id: "nempe", name: "Nempe", subtitle: "Cor que conecta as peças.",
    description: "Degradês, tipografia e fotografia compõem uma linguagem que se repete na apresentação, no cartão e na experiência digital.",
    image: "/assets/visual-identity/nempe.png", width: 1200, height: 900, background: "#2c2c2e",
    colors: ["#290038", "#9824DD", "#EF6288", "#FFAA63"],
    pieces: [
      {id: "symbol", title: "Símbolo em degradê", category: "brand", description: "O símbolo combina duas formas diagonais com uma transição de cores.", crop: [20, 16, 366, 293]},
      {id: "portrait", title: "Fotografia e comunicação", category: "application", description: "A fotografia recebe a mesma paleta usada nas demais peças da identidade.", crop: [20, 320, 366, 550]},
      {id: "hero", title: "Apresentação digital", category: "digital", description: "Uma composição de título, cores e chamada de ação apresenta a marca em uma página.", crop: [400, 16, 403, 405]},
      {id: "signature", title: "Assinatura da marca", category: "brand", description: "Nome e símbolo se organizam em uma assinatura horizontal.", crop: [400, 432, 403, 204]},
      {id: "campaign", title: "Peça de campanha", category: "application", description: "A paleta e o peso da tipografia mantêm a continuidade da comunicação.", crop: [400, 647, 403, 223]},
      {id: "card", title: "Cartão e produto", category: "application", description: "A identidade é aplicada ao cartão, com contraste entre o fundo escuro e as cores do símbolo.", crop: [816, 15, 368, 342]},
      {id: "phone", title: "Interface no celular", category: "digital", description: "A marca, as cores e os elementos da interface aparecem em uma aplicação móvel.", crop: [816, 369, 368, 501]},
    ],
  },
  {
    id: "casflow", name: "Casflow", subtitle: "Uma cor. Vários pontos de contato.",
    description: "O amarelo organiza o destaque visual. A mesma assinatura conecta o produto, a comunicação e as telas.",
    image: "/assets/visual-identity/casflow.png", width: 1024, height: 768, background: "#ffffff",
    colors: ["#FFD21F", "#000000", "#F4F4F4"],
    pieces: [
      {id: "signature", title: "Assinatura principal", category: "brand", description: "O nome em branco e o símbolo amarelo criam uma assinatura de alto contraste.", crop: [16, 16, 460, 225]},
      {id: "symbol", title: "Símbolo isolado", category: "brand", description: "A versão reduzida mantém a identificação sem depender do nome completo.", crop: [489, 16, 166, 225]},
      {id: "object", title: "Marca em volume", category: "application", description: "Uma aplicação tridimensional explora a forma do símbolo e a cor principal.", crop: [668, 16, 340, 485]},
      {id: "watch", title: "Interface no relógio", category: "digital", description: "A identidade se adapta a uma tela compacta, com o amarelo reservado aos elementos de destaque.", crop: [16, 254, 237, 247]},
      {id: "card", title: "Aplicação no cartão", category: "application", description: "O amarelo ocupa a superfície do produto, mantendo a assinatura visível.", crop: [269, 254, 386, 247]},
      {id: "phone", title: "Comunicação no aplicativo", category: "digital", description: "Símbolo, cores e tipografia conectam a interface à apresentação da marca.", crop: [16, 515, 639, 238]},
      {id: "portrait", title: "Fotografia de campanha", category: "application", description: "A fotografia participa da composição com o mesmo fundo amarelo usado na identidade.", crop: [668, 515, 340, 238]},
    ],
  },
];
