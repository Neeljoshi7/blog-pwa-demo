import axiosIns from "@/axios";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";


function showError(e) {
    let data = e;
console.log('Error: ', data);
    toast.error(data.message, {
      theme: "colored",
      autoClose: 3000,
      hideProgressBar: false,
      position: toast.POSITION.TOP_RIGHT,
      pauseOnHover: true,
    });
  }


export const getHTTPGetResponse = async (
    url:string,
    input:object = {},
    success_message:boolean = false
  ) => {
    try {
      const response = await axiosIns.get(url, input);
      let data = response;
  
      if (success_message) {

        toast.success("Get Data Successfully", {
          theme: "colored",
          autoClose: 3000,
          hideProgressBar: false,
          position: toast.POSITION.TOP_RIGHT,
          pauseOnHover: true,
        });
      }
      return data || true;
    } catch (e) {
      showError(e);
      return null;
    }
  };

  export const getHTTPPostResponse = async (
    url:string,
    input:object = {},
    success_message:boolean = false
  ) => {
    try {
      const response = await axiosIns.post(url, input);
      let data = response;
      console.log('response',response);

      if (success_message) {
        toast.success("Blog Added Successfully!", {
          theme: "colored",
          autoClose: 3000,
          hideProgressBar: false,
          position: toast.POSITION.TOP_RIGHT,
          pauseOnHover: true,
        });
    
      }
      return response || true;
    } catch (e) {
      showError(e);
      return null;
    }
  };
