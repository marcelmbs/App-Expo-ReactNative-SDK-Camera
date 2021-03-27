import React, { useState, useEffect, useRef } from 'react';
import { Platform, SafeAreaView, TouchableOpacity, View, StyleSheet, Modal, Image, ToastAndroid, Alert } from 'react-native';
import { Camera, camera } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import * as Permissions from 'expo-permissions'
import * as MediaLibrary from 'expo-media-library'
import Cabecalho from './components/Cabecalho'

export default function App() {
  //Status de acesso a camera
  const [temPermissao, setTemPermissao] = useState(null)
  //Status de acesso a galeria
  const [temPermissaoGaleria, setTemPermissaoGaleria] = useState(null)
  //Referência da Câmera
  const cameraRef = useRef(null)
  //Ícone padrão que serão exibidos
  const [iconePadrao, setIconePadrao] = useState('md') /* MD-Material Design*/
  // TIpo da câmera (front ou back)
  const [tipoCamera, setTipoCamera] = useState(Camera.Constants.Type.back)
  //Status inicial do flash
  const [tipoFlash, setTipoFlash] = useState(Camera.Constants.FlashMode.off)
  //foto capturada
  const [fotoCapturada, setFotoCapturada] = useState(null)
  //controle de exibição do modal
  const [exibeModal, setExibeModal] = useState(false)

  useEffect(() => {
    //Dependendo do SO, exibiremos diferente ícones.
    switch (Platform.OS) {
      case 'android':
        setIconePadrao('md')
        break
      case 'ios':
        setIconePadrao('ios')
        break
    }
  }, [])


  useEffect(() => { /*Executa o conteúdo no carregamento*/
    (async () => {
      if (Platform.OS === 'web') {
        const cameraDisponivel = await Camera.isAvailableAsync()
        setTemPermissao(cameraDisponivel)
      } else {
        const { status } = await Camera.requestPermissionsAsync() //granted
        setTemPermissao(status === 'granted')
      }
    }
    )();

    (async () => {
      //Solicita permissão na galeria de imagens
      const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY)
      setTemPermissaoGaleria(status === 'granted')
    }
    )();

  }, [])   /* QUando o array vazio, executa uma única vez*/

  if (temPermissao === false) {
    return <Text>Acesso negado à câmera ou o seu equipamento não possui uma.</Text>
  }

  async function tirarFoto() {
    if (cameraRef) {
      const options = {
        quality: 0.5,
        skipProcessing: true
      }
      const foto = await cameraRef.current.takePictureAsync(options)
      setFotoCapturada(foto.uri)
      setExibeModal(true)
      await obterResolucoes() //Lista as resoluções no console
      let msg = 'Foto capturada com sucesso!'
      iconePadrao === 'md'
        ? ToastAndroid.showWithGravity(msg, ToastAndroid.SHORT, ToastAndroid.CENTER)
        : Alert.alert('Imagem Capturada', msg)
      // Para iOS, utilize react-native-tiny-toast
    }
  }

  async function salvarFoto() {
    if (temPermissaoGaleria) {
      setExibeModal(false)
      const asset = await MediaLibrary.createAssetAsync(fotoCapturada)
      await MediaLibrary.createAlbumAsync('Fatecam', asset, false)
    } else {
      Alert.alert('Sem permissão', 'Infelizmente o app não tem permissão para salvar')
    }



  }
  async function obterResolucoes() {

    let resolucoes = await cameraRef.current.getAvailablePictureSizesAsync('16:9')
    console.log(`Resoluções suportadas: ${JSON.stringify(resolucoes)}`)
    if (resolucoes && resolucoes.length > 0) {
      console.log(`Maior qualidade: ${resolucoes[resolucoes.length - 1]}`)
      console.log(`Menor qualidade: ${resolucoes[0]}`)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Cabecalho titulo="Fatecam" />
      <Camera
        style={{ flex: 1 }}
        type={tipoCamera}
        flashMode={tipoFlash}
        ref={cameraRef}
      >
        <View style={styles.camera}>

          {/*Botão da Cãmera*/}
          <TouchableOpacity style={styles.touch} onPress={tirarFoto}>
            <Ionicons name={`${iconePadrao}-camera`} size={40} color="#9E9E9E" />
          </TouchableOpacity>

          {/*Botão câmera reversa*/}
          <TouchableOpacity style={styles.touch} onPress={() => {
            setTipoCamera(
              tipoCamera === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            )
          }}>
            <Ionicons name={`${iconePadrao}-camera-reverse`} size={40} color="#9E9E9E" />
          </TouchableOpacity>

          {/*Botão Flash*/}
          <TouchableOpacity style={styles.touch} onPress={() => {
            setTipoFlash(
              tipoFlash === Camera.Constants.FlashMode.on
                ? Camera.Constants.FlashMode.off
                : Camera.Constants.FlashMode.on
            )
          }}>
            <Ionicons name={tipoFlash === Camera.Constants.FlashMode.on
              ? `${iconePadrao}-flash`
              : `${iconePadrao}-flash-off`
            } size={40} color="#9E9E9E" />
          </TouchableOpacity>

        </View>
      </Camera>
      <Modal animationType="slide"
        transparent={true}
        visible={exibeModal}
      >
        <View style={styles.modalView}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={{ margin: 2 }} onPress={salvarFoto}>
              <Ionicons name={`${iconePadrao}-cloud-upload`} size={40} color="#121212" />
            </TouchableOpacity>
            {/*Botão Fechar*/}
            <TouchableOpacity onPress={() => setExibeModal(false)}
              accessibilityLabel={true}
              accessibilityLabel="Fechar"
              accessibilityHint="Fecha a janela atual"
            >
              <Ionicons name={`${iconePadrao}-close-circle`} size={40} color="#D9534F" />
            </TouchableOpacity>
          </View>
          <Image source={{ uri: fotoCapturada }}
            style={{ width: '90%', height: '50%', borderRadius: 20 }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  camera: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  touch: {
    margin: 20
  },
  modalView: {
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    opacity: 0.9,
    alignItems: 'center'
  }
})