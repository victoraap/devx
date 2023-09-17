require('dotenv').config({ path: './.env' });
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio'); // Añade esto para cargar y analizar el HTML

const botToken = process.env.botToken;
const apiToken = process.env.apiToken;
const apiUrl = process.env.apiUrl;

const bot = new Telegraf(botToken);

// Función para extraer la fecha de nacimiento y la edad
async function obtenerFechaNacimientoYEdad(dni, ctx) {
  const url = "https://dni-peru.com/buscar-fecha-de-nacimiento-con-dni-peru/";
  const data = `dni7=${dni}&fecha=Buscar`;

  try {
    const response = await axios.post(url, data);
    const $ = cheerio.load(response.data);

    const fechaNacimiento = $('.resultado p:contains("Fecha de Nacimiento:")').text();
    const fechaNacimientoMatch = fechaNacimiento.match(/\d{2}\/\d{2}\/\d{4}/);

    if (fechaNacimientoMatch) {
      const fechaNacimientoStr = fechaNacimientoMatch[0];
      const fechaNacimientoParts = fechaNacimientoStr.split('/');
      const diaNacimiento = parseInt(fechaNacimientoParts[0]);
      const mesNacimiento = parseInt(fechaNacimientoParts[1]) - 1;
      const anoNacimiento = parseInt(fechaNacimientoParts[2]);

      const fechaActual = new Date();
      const edad = fechaActual.getFullYear() - anoNacimiento;

      return { fechaNacimiento: fechaNacimientoStr, edad };
    } else {
      ctx.reply('No se encontró la fecha de nacimiento.');
      return null;
    }
  } catch (error) {
    console.error(error);
    ctx.reply('Ocurrió un error al obtener la fecha de nacimiento y la edad.');
    return null;
  }
}

bot.hears(/\/dni|\.dni/, async (ctx) => {
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
      // Llama a la función para obtener la fecha de nacimiento y la edad
      const fechaEdad = await obtenerFechaNacimientoYEdad(dni, ctx);

      if (fechaEdad) {
        const messageText = `
        ⚜️ <b>Status</b>  -»  <code> Success ✅</code>
⚜️ <b>DNI</b>  -»  <code>${dni}</code>
⚜️ <b>Nombres</b>  -» <code>${data.data.nombres}</code>
⚜️ <b>Apellido Paterno</b> -» <code>${data.data.apellido_paterno}</code>
⚜️ <b>Apellido Materno</b> -» <code>${data.data.apellido_materno}</code> 
⚜️ <b>Edad</b> -» <code>${fechaEdad.edad}</code> 
⚜️ <b>Fecha Nac</b> -» <code>${fechaEdad.fechaNacimiento}</code>  
⚜️ <b>Codigo Verificación</b> -» <code>${data.data.codigo_verificacion}</code>  
`;

        ctx.replyWithHTML(messageText, {
          reply_to_message_id: ctx.message.message_id,
          allow_sending_without_reply: true
        });
      }
    } else {
      const messageText = `
      ⚜️ <b>Status</b>  -»  <code> No Existe ❌</code>
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


bot.launch({
  webhook: {
    domain: 'https://dizzy-pear-ray.cyclic.app/',
    port: 3000
  }
});