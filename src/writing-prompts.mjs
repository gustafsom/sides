export const WRITING_PROMPTS = [
  {id:'a1-presentacion',level:'A1',context:'daily',skill:'agreement',minWords:25,maxWords:60,title:'Apresentação curta',prompt:'Escribe una presentación breve: quién eres, dónde vives, qué haces y dos cosas que te gustan.'},
  {id:'a1-rutina',level:'A1',context:'daily',skill:'verb',minWords:30,maxWords:70,title:'Minha rotina',prompt:'Describe tu rutina de un día normal desde la mañana hasta la noche.'},
  {id:'a1-familia',level:'A1',context:'daily',skill:'gender-number',minWords:25,maxWords:60,title:'Pessoas próximas',prompt:'Describe a dos personas importantes para ti y explica una cualidad de cada una.'},
  {id:'a1-ciudad',level:'A1',context:'daily',skill:'ser-estar',minWords:25,maxWords:60,title:'Onde eu moro',prompt:'Describe el lugar donde vives. Di dónde está y cómo es.'},
  {id:'a1-planes',level:'A1',context:'daily',skill:'verb',minWords:25,maxWords:60,title:'Planos',prompt:'Escribe qué vas a hacer el próximo fin de semana y con quién.'},
  {id:'a1-mensaje',level:'A1',context:'message',skill:'punctuation',minWords:20,maxWords:50,title:'Mensagem simples',prompt:'Escribe un mensaje corto para avisar que llegarás diez minutos tarde y pedir disculpas.'},
  {id:'a1-viaje',level:'A1',context:'travel',skill:'preposition',minWords:25,maxWords:60,title:'No hotel',prompt:'Escribe lo que dirías en la recepción para presentarte, confirmar una reserva y preguntar por el desayuno.'},
  {id:'a1-congregacion',level:'A1',context:'congregation',skill:'pronoun',minWords:25,maxWords:60,title:'Conversa depois da reunião',prompt:'Escribe una conversación breve para saludar a alguien, preguntarle cómo está y despedirte de forma amable.'},

  {id:'a2-experiencia',level:'A2',context:'daily',skill:'past',minWords:50,maxWords:100,title:'Uma experiência recente',prompt:'Cuenta algo interesante que hiciste la semana pasada. Explica dónde estabas, qué pasó y cómo terminó.'},
  {id:'a2-restaurante',level:'A2',context:'travel',skill:'pronoun',minWords:40,maxWords:90,title:'Problema no restaurante',prompt:'Escribe lo que dirías para explicar con cortesía que tu pedido llegó equivocado y pedir una solución.'},
  {id:'a2-transporte',level:'A2',context:'travel',skill:'preposition',minWords:45,maxWords:100,title:'Imprevisto de viagem',prompt:'Explica que perdiste una conexión de transporte, qué necesitas ahora y qué alternativa prefieres.'},
  {id:'a2-trabajo',level:'A2',context:'work',skill:'por-para',minWords:50,maxWords:110,title:'Tarefa no trabalho',prompt:'Describe una tarea de tu trabajo: para qué sirve, cómo la haces y por qué es importante.'},
  {id:'a2-opinion',level:'A2',context:'opinion',skill:'connectors',minWords:50,maxWords:110,title:'Preferência pessoal',prompt:'Explica si prefieres aprender presencialmente o a distancia. Da dos razones y un ejemplo.'},
  {id:'a2-reunion',level:'A2',context:'congregation',skill:'connectors',minWords:40,maxWords:90,title:'Comentário breve',prompt:'Sin copiar ninguna publicación, escribe un comentario de 40 a 60 segundos sobre una idea útil que hayas aprendido recientemente.'},
  {id:'a2-ayuda',level:'A2',context:'congregation',skill:'pronoun',minWords:40,maxWords:90,title:'Pedir ajuda com espanhol',prompt:'Escribe cómo pedirías ayuda a alguien de la congregación para confirmar una palabra o una pronunciación en español.'},
  {id:'a2-correo',level:'A2',context:'work',skill:'register',minWords:55,maxWords:120,title:'E-mail objetivo',prompt:'Escribe un correo breve para confirmar una reunión, indicar el horario y pedir que te avisen si hay algún cambio.'},

  {id:'b1-problema',level:'B1',context:'work',skill:'connectors',minWords:80,maxWords:160,title:'Resolver um problema',prompt:'Describe un problema de trabajo que podría ocurrir, sus posibles causas y una forma razonable de resolverlo.'},
  {id:'b1-cambio',level:'B1',context:'daily',skill:'past',minWords:80,maxWords:160,title:'Uma mudança importante',prompt:'Cuenta una experiencia en la que tuviste que adaptarte a un cambio. Explica qué resultó difícil y qué aprendiste.'},
  {id:'b1-viaje',level:'B1',context:'travel',skill:'past',minWords:80,maxWords:160,title:'Relato de viagem',prompt:'Narra un imprevisto durante un viaje y explica qué decisiones tomaste para solucionarlo.'},
  {id:'b1-comparacion',level:'B1',context:'opinion',skill:'connectors',minWords:90,maxWords:180,title:'Comparar opções',prompt:'Compara dos formas de organizar el tiempo de estudio. Explica ventajas, desventajas y cuál elegirías.'},
  {id:'b1-explicacion',level:'B1',context:'work',skill:'register',minWords:80,maxWords:170,title:'Explicação clara',prompt:'Explica un procedimiento de tu trabajo a una persona que nunca lo ha realizado. Organiza la explicación por pasos.'},
  {id:'b1-congregacion',level:'B1',context:'congregation',skill:'register',minWords:70,maxWords:150,title:'Receber alguém novo',prompt:'Escribe cómo conversarías con una persona nueva en la congregación para hacerla sentir bienvenida sin sonar demasiado formal.'},
  {id:'b1-introduccion',level:'B1',context:'talk',skill:'connectors',minWords:70,maxWords:140,title:'Introdução de um tema',prompt:'Elige un tema que conozcas y escribe una introducción breve que despierte interés, presente la idea principal y conduzca al desarrollo.'},
  {id:'b1-conclusion',level:'B1',context:'talk',skill:'connectors',minWords:70,maxWords:140,title:'Conclusão clara',prompt:'Elige un tema que conozcas y escribe una conclusión que resuma la idea principal y deje una aplicación práctica.'},

  {id:'b2-argumentacion',level:'B2',context:'opinion',skill:'connectors',minWords:130,maxWords:240,title:'Argumentar com equilíbrio',prompt:'Analiza una decisión que tenga ventajas y riesgos. Presenta al menos dos perspectivas y termina con una conclusión matizada.'},
  {id:'b2-formal',level:'B2',context:'work',skill:'register',minWords:120,maxWords:220,title:'Comunicação formal',prompt:'Redacta un mensaje profesional que describa un problema, presente evidencias disponibles, proponga una acción y solicite una respuesta concreta.'},
  {id:'b2-riesgo',level:'B2',context:'work',skill:'connectors',minWords:130,maxWords:240,title:'Análise de risco',prompt:'Explica un riesgo operativo hipotético, su probabilidad, sus posibles consecuencias y medidas preventivas razonables.'},
  {id:'b2-mediacion',level:'B2',context:'daily',skill:'register',minWords:120,maxWords:220,title:'Mediar um desacordo',prompt:'Escribe una respuesta para dos personas que no están de acuerdo. Reconoce ambas posiciones y propón un punto de encuentro.'},
  {id:'b2-aprendizaje',level:'B2',context:'opinion',skill:'subjunctive',minWords:130,maxWords:240,title:'Como aprender melhor',prompt:'Explica qué condiciones consideras necesarias para que una persona aprenda una lengua de manera constante y autónoma.'},
  {id:'b2-congregacion',level:'B2',context:'congregation',skill:'register',minWords:110,maxWords:210,title:'Explicar uma ideia com simplicidade',prompt:'Elige una idea espiritual que puedas expresar con tus propias palabras y explícasela a una persona que no conoce el tema, evitando vocabulario innecesariamente complejo.'},
  {id:'b2-discurso',level:'B2',context:'talk',skill:'connectors',minWords:120,maxWords:220,title:'Trecho de discurso',prompt:'Elige un tema propio y escribe un fragmento de dos minutos con una idea principal, una explicación, un ejemplo original y una transición clara.'},
  {id:'b2-sintesis',level:'B2',context:'opinion',skill:'register',minWords:120,maxWords:220,title:'Síntese e posição',prompt:'Resume con tus propias palabras dos puntos de vista sobre un tema cotidiano y después explica cuál te parece más convincente y por qué.'}
];

const LEVELS=['A1','A2','B1','B2'];
export function promptsUpTo(level='A1'){
  const max=Math.max(0,LEVELS.indexOf(level));
  return WRITING_PROMPTS.filter(x=>LEVELS.indexOf(x.level)<=max);
}
