import Image from "next/image";

export default function ProjectCard({imgSrc, name, description, link}: {imgSrc: string, name: string, description: string, link: string}) {
  return (
    <div className="flex gap-8 flex-col">
        <div className="flex-shrink-0 flex gap-8 items-center">
          <div className="flex-shrink-0 border border-orange rounded-[4px] p-0.5 bg-gradient-to-br from-peach via-yellow to-light-pink">
            <div className="rounded-[32px] p-1.5 bg-sand border border-orange">
              <img src={imgSrc} width="200" height="200" alt={name} className="rounded-[32px] w-16 h-16 md:w-[90px] md:h-[90px]" />
            </div>
          </div>
          <h3 className="text-blue text-md sm:text-2xl font-grad hover:underline"><a href={link} target="_blank">{name}</a></h3>
        </div>
        
      <p className="">
        {description.split('\n').map((item, index) => (
          <span key={index} className=" mb-3 block whitespace-pre-line text-justify 2xl:text-base text-sm">
            {item}
          </span>
        ))}
      </p>
    </div>
  )
}