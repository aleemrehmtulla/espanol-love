import { useState, useEffect, useRef } from "react";
import Head from "next/head";

import {
  Button,
  HStack,
  Heading,
  Icon,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { FaMicrophone, FaGithub } from "react-icons/fa";
import Beatloader from "react-spinners/BeatLoader";

import base64ToBlob from "@/utils/basetoblob";

let SpeechRecognition: { new (): SpeechRecognition };

if (typeof window !== "undefined") {
  SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
}

function EspanolLove() {
  const micRef = useRef<SpeechRecognition>();
  const audioRef = useRef<HTMLAudioElement>();

  const toast = useToast();

  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleListen = (mic: any, setText: any) => {
    if (!SpeechRecognition)
      return alert("Speech recognition is not available in your browser.");

    mic.continuous = true;
    mic.interimResults = true;
    mic.lang = "en-US";

    if (isListening) mic.start();
    if (!isListening) mic.stop();

    mic.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");
      console.log(transcript);
      setText(transcript);
      mic.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.log(event.error);
      };
    };
  };

  const translate = async () => {
    if (!text)
      return toast({
        title: "Enter text to translate first!",
        status: "error",
      });
    if (!audioRef.current)
      return toast({ title: "Error enabling audio", status: "error" });

    setLoading(true);

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Accept: "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const { audioDataBase64, translatedText } = await response.json();

    setText(translatedText);

    const audioBlob = base64ToBlob(audioDataBase64, "audio/mpeg");
    const audioURL = URL.createObjectURL(audioBlob);

    audioRef.current.src = audioURL;

    audioRef.current.play();
    setLoading(false);
  };

  // this is a hack to allow mobile browsers to play audio without user interaction
  const startAudioForPermission = async () => {
    if (!audioRef.current) return;
    await audioRef.current.play();
  };

  useEffect(() => {
    const mic = new SpeechRecognition();
    const audio = new Audio();
    micRef.current = mic;
    audioRef.current = audio;

    return () => {
      mic.stop();
    };
  }, []);

  useEffect(() => {
    handleListen(micRef.current, setText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  return (
    <>
      <Head>
        <title>español.love</title>
        <meta
          name="description"
          content="context-aware translations using gpt-4, spoken in a cloned voice"
        />
      </Head>
      <VStack pt={40} px={4} spacing={4} h="100vh" maxW="600px" mx="auto">
        <Heading as="h1" color="black">
          español.love 💌
        </Heading>
        <Text color="gray.500" textAlign="center">
          context-aware translations using gpt-4, spoken in a cloned voice
        </Text>

        <VStack w="100%" spacing={4}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} />
        </VStack>
        <HStack w="100%" spacing={4}>
          <Button
            h={9}
            variant="outline"
            onClick={() => {
              startAudioForPermission();
              translate();
            }}
            isLoading={loading}
            spinner={<Beatloader size={8} />}
          >
            Translate
          </Button>
          <Icon
            as={FaMicrophone}
            cursor="pointer"
            color={isListening ? "red.500" : "gray.500"}
            onClick={() => setIsListening((prevState) => !prevState)}
          />
        </HStack>
      </VStack>

      <Button
        variant="outline"
        pos="absolute"
        bottom={4}
        right={4}
        as="a"
        href="https://github.com/aleemrehmtulla/espanollove"
      >
        Deploy your own! <Icon ml={2} as={FaGithub} />
      </Button>
    </>
  );
}

export default EspanolLove;
