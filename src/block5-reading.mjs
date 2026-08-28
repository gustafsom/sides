const readingThemes = [
  {topic:'rotina',title:'Organizar la mañana',person:'Lucía',place:'la oficina',goal:'llegar con tiempo y empezar el día con calma',obstacle:'el autobús llegó con retraso',solution:'salió de casa un poco antes durante la semana siguiente',result:'consiguió organizar mejor la mañana'},
  {topic:'viaje',title:'Una reserva con cambios',person:'Diego',place:'el hotel',goal:'confirmar una reserva de dos noches',obstacle:'la fecha registrada no era la correcta',solution:'mostró el correo de confirmación y explicó el cambio',result:'la recepción corrigió la reserva'},
  {topic:'trabajo',title:'Un plazo ajustado',person:'Marina',place:'la oficina',goal:'terminar un informe antes del viernes',obstacle:'faltaban dos datos importantes',solution:'pidió la información y reorganizó las tareas',result:'entregó el informe a tiempo'},
  {topic:'reunion',title:'Preparar un comentario',person:'Pablo',place:'la reunión',goal:'dar un comentario claro en español',obstacle:'hablaba demasiado rápido cuando estaba nervioso',solution:'practicó varias veces con frases más breves',result:'pudo comentar con más calma'},
  {topic:'compras',title:'Elegir con calma',person:'Sara',place:'el mercado',goal:'comprar un producto adecuado sin gastar de más',obstacle:'había varias opciones parecidas',solution:'comparó el precio, la cantidad y lo que realmente necesitaba',result:'eligió una opción sencilla y útil'},
  {topic:'salud',title:'Cambiar una rutina',person:'Andrés',place:'el centro de salud',goal:'entender por qué estaba tan cansado',obstacle:'dormía poco durante la semana',solution:'organizó mejor el horario y siguió la recomendación de descansar',result:'notó una mejora gradual'},
  {topic:'relaciones',title:'Aclarar un malentendido',person:'Elena',place:'una cafetería',goal:'hablar con una amiga sobre un malentendido',obstacle:'cada una había entendido el mensaje de forma distinta',solution:'explicaron con calma lo que habían querido decir',result:'resolvieron el problema sin discutir'},
  {topic:'proyectos',title:'Revisar el plan',person:'Miguel',place:'una reunión de proyecto',goal:'mantener el objetivo sin aumentar el riesgo',obstacle:'una tarea importante se retrasó',solution:'cambió el orden de las etapas y confirmó nuevas fechas',result:'el equipo recuperó parte del tiempo'},
  {topic:'ambiente',title:'Menos residuos',person:'Carla',place:'su comunidad',goal:'reducir la cantidad de basura producida cada semana',obstacle:'muchos productos se usaban una sola vez',solution:'propuso reutilizar envases y separar materiales reciclables',result:'la cantidad de residuos disminuyó'},
  {topic:'medios',title:'Comprobar antes de compartir',person:'Javier',place:'un grupo de mensajes',goal:'saber si una noticia era fiable',obstacle:'el mensaje no indicaba la fuente original',solution:'buscó el dato en varias fuentes y comparó las fechas',result:'descubrió que la noticia estaba desactualizada'},
  {topic:'lectura',title:'Una lectura más natural',person:'Rosa',place:'su casa',goal:'preparar una lectura pública en español',obstacle:'se concentraba tanto en cada palabra que perdía el sentido de la frase',solution:'marcó grupos de palabras y practicó las pausas',result:'la lectura empezó a sonar más natural'},
  {topic:'aprendizaje',title:'Estudiar con recuperación',person:'Tomás',place:'su espacio de estudio',goal:'recordar expresiones durante conversaciones reales',obstacle:'releía mucho pero olvidaba al intentar hablar',solution:'empezó a ocultar las respuestas y recuperarlas de memoria',result:'pudo usar más expresiones sin consultar sus notas'},
  {topic:'conversacion',title:'Conocer a alguien',person:'Laura',place:'la congregación',goal:'conversar con una persona nueva en español',obstacle:'temía quedarse sin palabras y responder de forma muy breve',solution:'preparó dos preguntas sencillas y se concentró en escuchar la respuesta',result:'la conversación fue más natural de lo que esperaba'}
];

function readingFor(theme,level,index) {
  const baseQuestion = [
    {q:`¿Cuál era el objetivo de ${theme.person}?`,answers:[theme.goal]},
    {q:'¿Qué hizo para resolver la dificultad?',answers:[theme.solution]}
  ];
  if(level==='A1') return {
    code:`b5:r:A1:${index+1}`,level,title:theme.title,topic:theme.topic,difficulty:1,prerequisites:[],
    body:`${theme.person} va a ${theme.place}. Quiere ${theme.goal}. Tiene un problema: ${theme.obstacle}. Entonces ${theme.solution}. Al final, ${theme.result}.`,
    questions:baseQuestion
  };
  if(level==='A2') return {
    code:`b5:r:A2:${index+1}`,level,title:`${theme.title}: un cambio`,topic:theme.topic,difficulty:2,prerequisites:['grammar:preterito-indefinido'],
    body:`${theme.person} quería ${theme.goal} en ${theme.place}, pero ${theme.obstacle}. Para solucionarlo, ${theme.solution}. Al final, ${theme.result}. La experiencia le mostró que un pequeño cambio puede evitar un problema mayor.`,
    questions:baseQuestion
  };
  if(level==='B1') return {
    code:`b5:r:B1:${index+1}`,level,title:`${theme.title}: aprender del problema`,topic:theme.topic,difficulty:3,prerequisites:['grammar:subjuntivo-voluntad'],
    body:`Cuando ${theme.person} intentó ${theme.goal} en ${theme.place}, apareció una dificultad: ${theme.obstacle}. En vez de seguir de la misma manera, ${theme.solution}. Como resultado, ${theme.result}. La situación muestra que identificar la causa concreta suele ser más útil que repetir una estrategia que no está funcionando.`,
    questions:baseQuestion
  };
  return {
    code:`b5:r:B2:${index+1}`,level,title:`${theme.title}: una decisión con matices`,topic:theme.topic,difficulty:4,prerequisites:['grammar:conectores'],
    body:`El objetivo de ${theme.person} era ${theme.goal} en ${theme.place}. Sin embargo, ${theme.obstacle}. La respuesta no consistió simplemente en insistir: ${theme.solution}. Así, ${theme.result}. Más allá del resultado inmediato, el caso permite distinguir entre reaccionar ante un síntoma y ajustar la estrategia a la causa del problema; esa diferencia puede ser decisiva cuando la situación es más compleja.`,
    questions:baseQuestion
  };
}

export const block5Reading = ['A1','A2','B1','B2'].flatMap(level => readingThemes.map((theme,index)=>readingFor(theme,level,index)));