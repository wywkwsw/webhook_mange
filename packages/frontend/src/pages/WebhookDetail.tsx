import { useParams } from "react-router-dom";

const WebhookDetail = () => {
  const { id } = useParams();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Webhook Detail: {id}</h1>
    </div>
  );
};

export default WebhookDetail;
