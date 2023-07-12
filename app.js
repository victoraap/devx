require('dotenv').config({ path: './.env' });
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const botToken = process.env.botToken;
const apiToken = process.env.apiToken;
const apiUrl = process.env.apiUrl;

const bot = new Telegraf(botToken);

bot.hears(/\/dni|\.dni/, async (ctx)=> {
  const args = ctx.message.text.split(' ');
  if (args.length !== 2) {
    ctx.reply('El comando /dni debe tener un número de DNI después del espacio.');
    return;
  }

  const dni = args[1];

  if (dni.length !== 8) {
    ctx.reply('El número de DNI debe tener exactamente 8 dígitos.');
    return;
  }

  const url = `${apiUrl}${dni}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    const data = response.data;

    if (data.success) {
      const fechaNacimiento = new Date(data.data.fecha_nacimiento);
      const fechaActual = new Date();
      const diferenciaMilisegundos = fechaActual - fechaNacimiento;
      const edadMilisegundos = new Date(diferenciaMilisegundos);
      const edad = edadMilisegundos.getUTCFullYear() - 1970;

      const messageText = `
      \n\n⚜️ <b>Status</b>  -»  <code> Success ✅</code>
⚜️ <b>DNI</b>  -»  <code>${dni}</code>
⚜️ <b>Nombres Completos</b> -»  <code>${data.data.nombre_completo}</code>
⚜️ <b>Nombres</b>  -» <code>${data.data.nombres}</code>
⚜️ <b>Apellido Paterno</b> -» <code>${data.data.apellido_paterno}</code>
⚜️ <b>Apellido Materno</b> -» <code>${data.data.apellido_materno}</code> 
⚜️ <b>Edad</b> -» <code>${edad}</code> 
⚜️ <b>Fecha Nac</b> -» <code>${data.data.fecha_nacimiento}</code>  
⚜️ <b>Codigo Verificación</b> -» <code>${data.data.codigo_verificacion}</code>  
⚜️ <b>Estado Civil</b> -» <code>${data.data.estado_civil}</code> 
⚜️ <b>Direccion</b> -» <code>${data.data.direccion_completa}</code>`;

      ctx.replyWithHTML(messageText, {
        reply_to_message_id: ctx.message.message_id,
        allow_sending_without_reply: true
      });
    } else {
      const messageText = `
      \n\n⚜️ <b>Status</b>  -»  <code> No Existe ❌</code>
⚜️ <b>Response</b>  -»  <code>${data.message}</code>`;


          ctx.replyWithHTML(messageText, {
            reply_to_message_id: ctx.message.message_id,
            allow_sending_without_reply: true
          });
    }

    
  } catch (error) {
    console.error(error);
    ctx.reply('Ocurrió un error al consultar los datos del DNI.');
  }
});

//reasons

bot.start((ctx) => {
  ctx.reply('¡Hola! Soy un bot de Telegram.');
});

bot.launch();