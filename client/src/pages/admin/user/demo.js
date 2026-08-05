/**
|--------------------------------------------------
| Set and Fetch trang list
|--------------------------------------------------
*/
//Set State
  const [nike, setNike] = useState([]);

//Fetch data từ axios
  const fetchNike = async () => {
    try {
      const res = await axios.get("Link endpoint"); //Trang List
      const res = await axios.get(`Link endpoint/${id}`);  //Trang detail theo id
      return res.data;
    } catch (error) {
      console.error("Failed to fetch:", error);
      return [];
    }
  };

//Set useeffect
  useEffect(() => {
    const getAdidas = async () => {
      const data = await fetchAdidas();
      setAdidas(data);
    };

    geAdidas();
  }, []);
};

/**
|--------------------------------------------------
| Set and Fetch trang list
|--------------------------------------------------
*/
//Set State
  const [adidas, setAdidas] = useState([]);

//Fetch data từ axios
  const fetchAdidas = async () => {
    try {
      const res = await axios.get("Link endpoint"); //Trang List
      const res = await axios.get(`Link endpoint/${id}`);  //Trang detail theo id
      return res.data;
    } catch (error) {
      console.error("Failed to fetch:", error);
      return [];
    }
  };

//Set useeffect
  useEffect(() => {
    const getAdidas = async () => {
      const data = await fetchAdidas();
      setAdidas(data);
    };

    geAdidas();
  }, []);
};
