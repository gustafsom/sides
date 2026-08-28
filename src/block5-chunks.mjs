import { curriculumFramework } from './block5-framework.mjs';

const slots = {
  A1: [
    ['hablar','falar'],['leer','ler'],['escribir','escrever'],['escuchar','escutar'],['practicar','praticar'],
    ['estudiar','estudar'],['trabajar','trabalhar'],['descansar','descansar'],['cocinar','cozinhar'],['caminar','caminhar']
  ],
  A2: [
    ['viajar','viajar'],['reservar','reservar'],['confirmar','confirmar'],['cambiar','mudar'],['explicar','explicar'],
    ['organizar','organizar'],['terminar','terminar'],['devolver','devolver'],['decidir','decidir'],['mejorar','melhorar']
  ],
  B1: [
    ['aclarar','esclarecer'],['comparar','comparar'],['resumir','resumir'],['justificar','justificar'],['resolver','resolver'],
    ['proponer','propor'],['comprobar','verificar'],['evaluar','avaliar'],['adaptar','adaptar'],['coordinar','coordenar']
  ],
  B2: [
    ['matizar','nuançar'],['fundamentar','fundamentar'],['cuestionar','questionar'],['contrastar','contrastar'],['anticipar','antecipar'],
    ['negociar','negociar'],['reformular','reformular'],['profundizar','aprofundar'],['sintetizar','sintetizar'],['contextualizar','contextualizar']
  ]
};

const chunkFamilies = {
  A1: [
    ['querer','Quiero {es}.','Quero {pt}.','Use “querer + infinitivo” para expressar intenção.'],
    ['necesitar','Necesito {es}.','Preciso {pt}.','“Necesitar + infinitivo” expressa necessidade.'],
    ['poder','Puedo {es}.','Posso {pt}.','“Poder + infinitivo” indica possibilidade ou capacidade.'],
    ['ir-a','Voy a {es}.','Vou {pt}.','“Ir a + infinitivo” é uma forma frequente de falar de futuro próximo.'],
    ['gustar','Me gusta {es}.','Gosto de {pt}.','Com atividades, “me gusta + infinitivo” é uma estrutura natural.'],
    ['tener-que','Tengo que {es}.','Tenho que {pt}.','“Tener que + infinitivo” expressa obrigação.'],
    ['antes-de','Antes de {es}, preparo todo.','Antes de {pt}, preparo tudo.','Depois de preposição, o infinitivo funciona bem para falar de ações.'],
    ['despues-de','Después de {es}, descanso.','Depois de {pt}, descanso.','“Después de + infinitivo” organiza uma sequência de ações.']
  ],
  A2: [
    ['acabar-de','Acabo de {es}.','Acabei de {pt}.','“Acabar de + infinitivo” indica uma ação muito recente.'],
    ['decidir','He decidido {es}.','Decidi {pt}.','O pretérito perfecto pode conectar uma decisão passada ao presente.'],
    ['todavia-no','Todavía no he podido {es}.','Ainda não consegui {pt}.','“Todavía no” mantém uma ação pendente até o presente.'],
    ['llevar','Llevo una hora intentando {es}.','Estou há uma hora tentando {pt}.','“Llevar + tempo + gerundio” expressa duração até o presente.'],
    ['preferir','Prefiero {es} antes que esperar.','Prefiro {pt} em vez de esperar.','“Preferir” ajuda a comparar escolhas.'],
    ['quisiera','Si es posible, quisiera {es}.','Se for possível, gostaria de {pt}.','“Quisiera” suaviza pedidos e soa cortês.'],
    ['tener-pensado','Tengo pensado {es} mañana.','Pretendo {pt} amanhã.','“Tener pensado + infinitivo” expressa plano.'],
    ['conseguir','Al final conseguí {es}.','No fim consegui {pt}.','“Conseguir + infinitivo” destaca o resultado alcançado.']
  ],
  B1: [
    ['aunque','Aunque sea difícil, voy a {es}.','Embora seja difícil, vou {pt}.','“Aunque + subjuntivo” pode apresentar uma dificuldade não impeditiva.'],
    ['importante-que','Es importante que podamos {es}.','É importante que possamos {pt}.','Avaliação + “que” frequentemente pede subjuntivo.'],
    ['no-creo','No creo que sea necesario {es}.','Não acho que seja necessário {pt}.','Negação de opinião favorece o subjuntivo.'],
    ['si-tuviera','Si tuviera más tiempo, podría {es}.','Se eu tivesse mais tempo, poderia {pt}.','Hipótese improvável: “si + imperfecto de subjuntivo + condicional”.'],
    ['lo-que-cuesta','Lo que más me cuesta es {es}.','O que mais me custa é {pt}.','Estrutura útil para explicar dificuldades pessoais.'],
    ['darse-cuenta','Me di cuenta de que debía {es}.','Percebi que precisava {pt}.','“Darse cuenta de que” introduz uma percepção.'],
    ['conviene','Conviene {es} antes de decidir.','Convém {pt} antes de decidir.','“Conviene + infinitivo” dá uma recomendação geral.'],
    ['para-que','Para que funcione, hay que {es}.','Para que funcione, é preciso {pt}.','“Para que” apresenta finalidade; “hay que” expressa necessidade impessoal.']
  ],
  B2: [
    ['por-mas-que','Por más que intentemos {es}, habrá límites.','Por mais que tentemos {pt}, haverá limites.','“Por más que + subjuntivo” introduz concessão.'],
    ['no-basta','No basta con {es}; también hay que explicarlo.','Não basta {pt}; também é preciso explicar.','“No basta con” ajuda a construir argumentação equilibrada.'],
    ['de-haber','De haber podido {es}, lo habría hecho antes.','Se tivesse podido {pt}, teria feito antes.','“De haber + participio” é uma forma condensada de condição passada.'],
    ['aun-cuando','Aun cuando convenga {es}, debemos valorar el contexto.','Mesmo que convenha {pt}, devemos avaliar o contexto.','“Aun cuando” admite contraste com nuance.'],
    ['no-tanto-como','La clave no consiste tanto en {es} como en comprender el propósito.','A chave não consiste tanto em {pt} quanto em compreender o objetivo.','“No tanto... como...” contrasta peso relativo entre ideias.'],
    ['siempre-que','Conviene {es} siempre que haya una razón clara.','Convém {pt} desde que haja uma razão clara.','“Siempre que + subjuntivo” pode estabelecer condição.'],
    ['cabe','Cabe la posibilidad de {es} antes de decidir.','Existe a possibilidade de {pt} antes de decidir.','“Cabe la posibilidad de + infinitivo” é uma construção formal para indicar uma opção que merece análise.'],
    ['lejos-de','Lejos de {es} sin criterio, debemos analizar primero.','Longe de {pt} sem critério, devemos analisar primeiro.','“Lejos de + infinitivo” contrapõe uma conduta a outra.']
  ]
};

const fill = (tpl,es,pt,lang='es') => tpl.replaceAll(lang==='es'?'{es}':'{pt}',lang==='es'?es:pt);

export const block5LearningItems = Object.entries(chunkFamilies).flatMap(([level,families]) =>
  families.flatMap(([skill,esTpl,ptTpl,explanation],familyIndex) =>
    slots[level].map(([es,pt],slotIndex) => ({
      code:`b5:chunk:${level}:${familyIndex+1}:${slotIndex+1}`,
      kind:'chunk',level,skill,
      prompt:fill(ptTpl,es,pt,'pt'),
      answer:fill(esTpl,es,pt,'es'),
      alternatives:[],
      explanation,
      example:fill(esTpl,es,pt,'es'),
      topic: level==='A1'?'cotidiano':level==='A2'?'autonomia':level==='B1'?'comunicacao':'argumentacao',
      difficulty:curriculumFramework[level].difficulty,
      prerequisites: level==='A1'?[]:[`grammar:${level==='A2'?'presente':level==='B1'?'subjuntivo':'conectores'}`],
      tags:`chunk,b5,${skill}`
    }))
  )
);