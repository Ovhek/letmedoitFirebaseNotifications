// Referencia a las funciones
const functions = require("firebase-functions");
// Referencia al Admin
const admin = require("firebase-admin");
// Inicializamos la aplicación
admin.initializeApp();
// exports --> indica que es una función
// (después del punto se pone el nombre de la función en si)
// Nos ponemos a la escucha de la coleccion deals
// y esperamos a que se produzca una actualización.
exports.sendAcceptDealsNotification = functions.firestore
    .document("deals/{deal_id}")
    .onUpdate((snapshot, context) => {
      // previous document
      const oldSnap = snapshot.before.data();
      // current document
      const newSnap = snapshot.after.data();
      // si "accepted" era falso y ahora es true
      // ejecutamos el código correspondiente.
      if (oldSnap.accepted === false && newSnap.accepted === true) {
        // referencia a la colección del usuario que creó el Trato
        const fromData = admin.firestore()
            .collection("users")
            .doc(newSnap.users.userOneId)
            .get();
        // referencia a la colección del otro usuario
        const toData = admin.firestore()
            .collection("users")
            .doc(newSnap.users.userTwoId)
            .get();
        // Utilizamos un Promise a fin de obtener
        // las referencias de los usuarios
        return Promise.all([fromData, toData]).then((result) => {
          // usuario que creó el deal
          const fromUser = result[0].data();
          // usuarió que aceptó el deal
          const toUser = result[1].data();
          // device token para poder enviar la notificación
          const deviceToken = fromUser.deviceToken;
          // Metadatos de la notificación
          const payload = {
            notification: {
              title: "Trato Acceptado",
              body: `El usuario @${toUser.username} \n`+
              "ha aceptado el trato.",
              icon: "default",
            },
          };
          // Función encargada de enviar los datos al dispositivo
          // con el token asociado.
          return admin.messaging().sendToDevice(deviceToken, payload)
              .then((result) =>{
                console.log("Notification Sent");
              });
        });
      } else return null;
    });

exports.sendDenyDealsNotification = functions.firestore
    .document("deals/{deal_id}")
    .onDelete((snapshot, context) => {
      // previous document
      const deletedDeal = snapshot.data();
      // current document
      // si "accepted" era falso y ahora es true
      // ejecutamos el código correspondiente.
      // referencia a la colección del usuario que creó el Trato
      const fromData = admin.firestore()
          .collection("users")
          .doc(deletedDeal.users.userOneId)
          .get();
      // referencia a la colección del otro usuario
      const toData = admin.firestore()
          .collection("users")
          .doc(deletedDeal.users.userTwoId)
          .get();
      // Utilizamos un Promise a fin de obtener
      // las referencias de los usuarios
      return Promise.all([fromData, toData]).then((result) => {
        // usuario que creó el deal
        const fromUser = result[0].data();
        // usuarió que aceptó el deal
        const toUser = result[1].data();
        // device token para poder enviar la notificación
        const deviceTokenUserOne = fromUser.deviceToken;
        const deviceTokenUserTwo = toUser.deviceToken;
        // Metadatos de la notificación
        const payloadUserTwo = {
          notification: {
            title: "Trato Rechazado",
            body: `El trato con el usuario @${toUser.username} \n`+
            "ha sido rechazado.",
            icon: "default",
          },
        };
        const payloadUserOne = {
          notification: {
            title: "Trato Rechazado",
            body: `El trato con el usuario @${fromUser.username} \n`+
            "ha sido rechazado.",
            icon: "default",
          },
        };
        const messageToUserOne = admin.messaging().sendToDevice(deviceTokenUserOne, payloadUserOne);
        const messagetoUserTwo = admin.messaging().sendToDevice(deviceTokenUserTwo, payloadUserTwo);
        return Promise.all([messageToUserOne, messagetoUserTwo]).then((result) => {
          console.log("Notification Sent");
        });
      });
    });
exports.createDealNotification = functions.firestore
    .document("deals/{deal_id}")
    .onCreate((snapshot, context) => {
      // current document
      const createdDeal = snapshot.data();
      // referencia a la colección del usuario que creó el Trato
      const fromData = admin.firestore()
          .collection("users")
          .doc(createdDeal.users.userOneId)
          .get();
      // referencia a la colección del otro usuario
      const toData = admin.firestore()
          .collection("users")
          .doc(createdDeal.users.userTwoId)
          .get();
      // Utilizamos un Promise a fin de obtener
      // las referencias de los usuarios
      return Promise.all([fromData, toData]).then((result) => {
        const fromUser = result[0].data();
        const toUser = result[1].data();
        // device token para poder enviar la notificación
        const deviceTokenUserTwo = toUser.deviceToken;
        const payloadUserTwo = {
          notification: {
            title: "Proposición de trato",
            body: `El usuario @${fromUser.username} \n`+
            "Quiere hacer un trato.",
            icon: "default",
          },
        };
        const messagetoUserTwo = admin.messaging().sendToDevice(deviceTokenUserTwo, payloadUserTwo);
        return Promise.all([messagetoUserTwo]).then((result) => {
          console.log("Notification Sent");
        });
      });
    });
exports.sendConcludeNotification = functions.firestore
    .document("deals/{deal_id}")
    .onUpdate((snapshot, context) => {
      const newSnap = snapshot.after.data();

      // Usuario Uno (Es el que creo el deal)
      const fromData = admin.firestore()
          .collection("users")
          .doc(newSnap.users.userOneId)
          .get();

      // Usuario dos
      const toData = admin.firestore()
          .collection("users")
          .doc(newSnap.users.userTwoId)
          .get();

      if (newSnap.conclude == 1) {
        return Promise.all([fromData, toData]).then((result) => {
          const fromUser = result[0].data();
          const toUser = result[1].data();
          const deviceToken = toUser.deviceToken;

          const payload = {
            notification: {
              title: "Trato concluido",
              body: `El usuario @${fromUser.username} \n`+
              "ha concluido el trato.",
              icon: "default",
            },
          };
          return admin.messaging().sendToDevice(deviceToken, payload)
              .then((result) =>{
                console.log("Notification Sent");
              });
        });
      } else if (newSnap.conclude == 2) {
        return Promise.all([fromData, toData]).then((result) => {
          const fromUser = result[0].data();
          const toUser = result[1].data();
          const deviceToken = fromUser.deviceToken;

          const payload = {
            notification: {
              title: "Trato concluido",
              body: `El usuario @${toUser.username} \n`+
              "ha concludo el trato.",
              icon: "default",
            },
          };
          return admin.messaging().sendToDevice(deviceToken, payload)
              .then((result) =>{
                console.log("Notification Sent");
              });
        });
      } else if (newSnap.conclude == 3) {
        return Promise.all([fromData, toData]).then((result) => {
          const fromUser = result[0].data();
          const toUser = result[1].data();
          const deviceToken1 = fromUser.deviceToken;
          const deviceToken2 = toUser.deviceToken;
          const payload1 = {
            notification: {
              title: "Trato concluido",
              body: "Se ha concluido el trato con \n"+
              `@${toUser.username}`,
              icon: "default",
            },
          };
          const payload2 = {
            notification: {
              title: "Trato concluido",
              body: "Se ha concluido el trato con \n"+
              `@${fromUser.username}`,
              icon: "default",
            },
          };

          const messagingOne = admin.messaging().sendToDevice(deviceToken1, payload1);
          const messagingTwo = admin.messaging().sendToDevice(deviceToken2, payload2);
          return Promise.all([messagingOne, messagingTwo])
              .then((result) =>{
                console.log("Notification Sent");
              });
        });
      } else return null;
    });
